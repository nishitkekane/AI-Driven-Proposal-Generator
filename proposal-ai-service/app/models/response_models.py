from typing import Literal
from pydantic import BaseModel, Field, ConfigDict

# ── Plan Response ──────────────────────────────────────────────────────────────

class PlanResponse(BaseModel):
    """
    Unified HITL-aware planning response.

    The `stage` field tells the caller which phase was executed:
      - "AMBIGUITIES": Phase 1 completed. `ambiguities` is populated; `tasks` is empty.
      - "FINALIZED":   Phase 2 completed. `tasks` is populated; `ambiguities` is empty.
    """

    model_config = ConfigDict(extra="ignore")

    stage: Literal["AMBIGUITIES", "FINALIZED"] = Field(
        ...,
        description="Which planning phase was executed.",
    )

    ambiguities: list[str] = Field(
        default_factory=list,
        description="Blocking clarifying questions (Phase 1 only).",
    )

    tasks: list[str] = Field(
        default_factory=list,
        description="Ordered implementation tasks (Phase 2 only).",
    )


# ── Research Response ──────────────────────────────────────────────────────────

class ResearchFinding(BaseModel):
    """A single task-anchored insight derived from web search snippets."""

    model_config = ConfigDict(extra="ignore")

    task_reference: str = Field(
        default="General",
        description='Task this finding supports, e.g. "Task 3".',
    )

    insight: str = Field(
        default="",
        description="Concise, factual insight from the snippet.",
    )

    confidence: Literal["high", "medium", "low"] = Field(
        default="medium",
        description="Confidence level based on snippet quality and specificity.",
    )


class ResearchSource(BaseModel):
    """A web source that contributed to at least one accepted finding."""

    model_config = ConfigDict(extra="ignore")

    title: str = Field(default="Web Source", description="Page or article title.")
    url: str = Field(default="", description="Source URL.")
    relevance: str = Field(default="Research reference", description="Which task(s) this source supports.")


class ResearchResponse(BaseModel):
    """Structured output from the Researcher Agent."""

    model_config = ConfigDict(extra="ignore")

    findings: list[ResearchFinding] = Field(
        default_factory=list,
        description="Task-anchored research findings.",
    )

    sources: list[ResearchSource] = Field(
        default_factory=list,
        description="Web sources that backed accepted findings.",
    )