from pydantic import BaseModel, Field


class PlanRequest(BaseModel):
    """
    HITL-aware planning request.

    Phase 1 (Ambiguity Detection):
        Send only `text`. The absence of `answers` signals Phase 1.

    Phase 2 (Plan Finalization):
        Send `text` + `answers` + `ambiguities_snapshot`.
        `answers` must be index-matched to `ambiguities_snapshot`.
    """

    text: str = Field(
        ...,
        min_length=10,
        max_length=50_000,
        description="Raw project requirements / RFP text.",
    )

    answers: list[str] | None = Field(
        default=None,
        description=(
            "User's answers to the ambiguities returned in Phase 1. "
            "Presence of this field triggers Phase 2 (finalization). "
            "Must be index-matched to `ambiguities_snapshot`."
        ),
    )

    ambiguities_snapshot: list[str] | None = Field(
        default=None,
        description=(
            "The exact ambiguity questions returned in Phase 1. "
            "Sent back by the client so the backend can build Q&A pairs "
            "for the finalization prompt without server-side session state."
        ),
    )


class ResearchContext(BaseModel):
    """
    Optional metadata that gives the Researcher Agent domain context
    to derive better-scoped search queries internally.
    All fields are optional — provide as many as are available.
    """

    project_title: str = Field(default="", description="Title of the RFP or project.")
    client_name: str = Field(default="", description="Client or company name.")
    industry: str = Field(default="", description="Industry domain.")
    budget_range: str = Field(default="", description="Budget range string.")
    deadline: str = Field(default="", description="Timeline or deadline constraint.")


class ResearchRequest(BaseModel):
    """
    Request body for the Researcher Agent endpoint (POST /research).

    The caller provides the finalized task list and optional project context.
    The Researcher Agent internally derives its own search queries from these inputs —
    no search queries are accepted or expected from the caller.
    """

    tasks: list[str] = Field(
        ...,
        min_length=1,
        description="The finalized, approved implementation task list.",
    )

    context: ResearchContext = Field(
        default_factory=ResearchContext,
        description=(
            "Domain context used by the agent to sharpen its internally derived "
            "search queries. All sub-fields are optional."
        ),
    )