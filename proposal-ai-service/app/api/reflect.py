import json

from app.services.json_utils import extract_json
import logging
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, status
from pydantic import BaseModel, Field, ConfigDict, AliasChoices

from app.api.execute import SelectedPricing
from app.models.response_models import ResearchFinding
from app.services.llm_client import LLMClient


logger = logging.getLogger(__name__)

router = APIRouter()

llm_client = LLMClient()


BASE_DIR = Path(__file__).resolve().parent.parent
PROMPTS_DIR = BASE_DIR / "prompts"


def _load_prompt(filename: str) -> str:
    path = PROMPTS_DIR / filename
    if not path.exists():
        raise FileNotFoundError(
            f"Prompt file not found: {path}"
        )
    return path.read_text(encoding="utf-8")


# ============================================================
# REFLECTOR MODELS
# ============================================================

class ReflectorIssue(BaseModel):
    model_config = ConfigDict(extra="ignore")

    criterion: str = Field(default="Quality")
    severity: Literal["HIGH", "MEDIUM", "LOW"] = Field(default="LOW")
    description: str = Field(default="")
    evidence: str = Field(default="")


class ReflectorRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    tasks: list[str] = Field(default_factory=list)
    findings: list[ResearchFinding] = Field(default_factory=list)
    selected_pricing: SelectedPricing = Field(validation_alias=AliasChoices("selected_pricing", "selectedPricing"))
    draft: str = Field(default="")
    retry_attempt: int = Field(default=0, ge=0, validation_alias=AliasChoices("retry_attempt", "retryAttempt"))


class ReflectorResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    verdict: Literal["PASS", "FAIL"] = Field(default="PASS")
    overall_score: int = Field(default=85, ge=0, le=100)
    issues: list[ReflectorIssue] = Field(default_factory=list)
    revision_instructions: str = Field(default="")
    reviewer_summary: str = Field(default="Draft verified.")


# ============================================================
# REVIEW ENDPOINT
# ============================================================

@router.post(
    "/review",
    response_model=ReflectorResponse,
    status_code=status.HTTP_200_OK
)
async def review_draft(
    request: ReflectorRequest
) -> ReflectorResponse:

    logger.info(
        "Reflector review started. Retry attempt: %s",
        request.retry_attempt
    )

    system_prompt = _load_prompt(
        "reflector_prompt.txt"
    )

    user_prompt_data = {

        "tasks": request.tasks,

        "findings": [
            finding.model_dump()
            for finding in request.findings
        ],

        "selected_pricing":
            request.selected_pricing.model_dump(),

        "draft": request.draft,

        "retry_attempt":
            request.retry_attempt
    }

    raw = await llm_client.chat(
        system_prompt=system_prompt,

        user_prompt=json.dumps(
            user_prompt_data,
            indent=2
        ),

        temperature=0.1
    )

    data = extract_json(raw)

    response = ReflectorResponse.model_validate(data)

    logger.info(
        "Reflector verdict: %s | Score: %s",
        response.verdict,
        response.overall_score
    )

    return response