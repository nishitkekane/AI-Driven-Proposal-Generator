"""
Planner Agent — HITL-aware single endpoint
==========================================

POST /plan

Phase 1 — Ambiguity Detection
  Request:  { "text": "..." }
  Response: { "stage": "AMBIGUITIES", "ambiguities": [...], "tasks": [] }

Phase 2 — Plan Finalization
  Request:  { "text": "...", "answers": [...], "ambiguities_snapshot": [...] }
  Response: { "stage": "FINALIZED", "ambiguities": [], "tasks": [...] }

Phase is detected automatically: if `answers` is absent → Phase 1, else → Phase 2.
"""

import json
import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException, status

from app.models.request_models import PlanRequest
from app.models.response_models import PlanResponse
from app.services.json_utils import extract_json
from app.services.llm_client import LLMClient
from app.services.llm_exceptions import LLMError

logger = logging.getLogger(__name__)
router = APIRouter()
llm_client = LLMClient()

BASE_DIR = Path(__file__).resolve().parent.parent
PROMPTS_DIR = BASE_DIR / "prompts"


def _load_prompt(filename: str) -> str:
    """Load a prompt file from the prompts directory."""
    path = PROMPTS_DIR / filename
    try:
        return path.read_text(encoding="utf-8")
    except FileNotFoundError:
        logger.error("Prompt file not found: %s", path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"System configuration error: prompt file '{filename}' missing.",
        )


def _build_finalize_user_prompt(
    text: str,
    ambiguities: list[str],
    answers: list[str],
) -> str:
    """
    Combines original requirements with Q&A pairs for the finalization prompt.
    Each ambiguity is paired with its answer by index.
    """
    pairs = "\n".join(
        f"Q{i + 1}: {q}\nA{i + 1}: {a}"
        for i, (q, a) in enumerate(zip(ambiguities, answers))
    )
    return (
        f"{text}\n\n"
        f"--- Clarifications Provided by the User ---\n"
        f"{pairs}"
    )


# ── Phase 1: Ambiguity Detection ──────────────────────────────────────────────

async def _run_ambiguity_phase(text: str) -> PlanResponse:
    """
    Call the LLM with the ambiguity detection prompt.
    Returns only ambiguities; tasks list is empty.
    """
    system_prompt = _load_prompt("planner_ambiguity_prompt.txt")

    try:
        raw = await llm_client.chat(
            system_prompt=system_prompt,
            user_prompt=text,
            temperature=0.2,
        )
        data = extract_json(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Planner returned invalid JSON in Phase 1: {exc}",
        )
    except LLMError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"LLM call failed in Phase 1: {exc}",
        )

    ambiguities = data.get("ambiguities", [])
    logger.info("Phase 1 complete — %d ambiguities detected.", len(ambiguities))

    return PlanResponse(
        stage="AMBIGUITIES",
        ambiguities=ambiguities,
        tasks=[],
    )


# ── Phase 2: Plan Finalization ────────────────────────────────────────────────

async def _run_finalize_phase(
    text: str,
    ambiguities_snapshot: list[str],
    answers: list[str],
) -> PlanResponse:
    """
    Call the LLM with the finalization prompt (requirements + Q&A pairs).
    Returns only tasks; ambiguities list is empty.
    """
    system_prompt = _load_prompt("planner_finalize_prompt.txt")
    user_prompt = _build_finalize_user_prompt(text, ambiguities_snapshot, answers)

    try:
        raw = await llm_client.chat(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.2,
        )
        data = extract_json(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Planner returned invalid JSON in Phase 2: {exc}",
        )
    except LLMError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"LLM call failed in Phase 2: {exc}",
        )

    tasks = data.get("tasks", [])
    logger.info("Phase 2 complete — %d tasks finalized.", len(tasks))

    return PlanResponse(
        stage="FINALIZED",
        ambiguities=[],
        tasks=tasks,
    )


# ── Router ────────────────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=PlanResponse,
    status_code=status.HTTP_200_OK,
    summary="HITL Planner — Phase 1 or Phase 2",
    description=(
        "**Phase 1** (no `answers` field): Detect blocking ambiguities in the requirements.\n\n"
        "**Phase 2** (`answers` + `ambiguities_snapshot` present): Produce the final task list "
        "using the original requirements and user-provided clarification answers."
    ),
)
async def plan(request: PlanRequest) -> PlanResponse:
    """
    Single HITL endpoint for the Planner Agent.
    Phase is auto-detected from the presence of `answers` in the request body.
    """
    if request.answers is None:
        # ── Phase 1 ───────────────────────────────────────────────────────────
        logger.info("Planner Phase 1 triggered — ambiguity detection.")
        return await _run_ambiguity_phase(request.text)
    else:
        # ── Phase 2 ───────────────────────────────────────────────────────────
        logger.info("Planner Phase 2 triggered — plan finalization.")

        # Validate that the snapshot and answers are coherent
        snapshot = request.ambiguities_snapshot or []
        answers = request.answers

        if len(answers) != len(snapshot):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    f"`answers` length ({len(answers)}) does not match "
                    f"`ambiguities_snapshot` length ({len(snapshot)}). "
                    "Each answer must correspond to one ambiguity."
                ),
            )

        return await _run_finalize_phase(
            text=request.text,
            ambiguities_snapshot=snapshot,
            answers=answers,
        )
