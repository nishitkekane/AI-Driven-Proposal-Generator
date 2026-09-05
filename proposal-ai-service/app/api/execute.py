import json

from app.services.json_utils import extract_json
import logging
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, status
from pydantic import BaseModel, Field, ConfigDict, AliasChoices

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
# PRICING MODELS
# ============================================================

class RateCardItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    item_name: str = Field(validation_alias=AliasChoices("item_name", "itemName"), default="Standard Rate")
    category: str = Field(default="Engineering")
    unit: str = Field(default="Hour")
    price: float = Field(default=100.0)
    currency: str = Field(default="USD")

class HistoricalProject(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    title: str = Field(default="Historical Project")
    tasks: list[str] = Field(default_factory=list)
    hours_spent: float = Field(validation_alias=AliasChoices("hours_spent", "hoursSpent"), default=40.0)

class PricingRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    tasks: list[str] = Field(default_factory=list)
    findings: list[ResearchFinding] = Field(default_factory=list)
    rate_card: list[RateCardItem] = Field(default_factory=list, validation_alias=AliasChoices("rate_card", "rateCard"))
    historical_data: list[HistoricalProject] = Field(
        default_factory=list,
        validation_alias=AliasChoices("historical_data", "historicalData")
    )

class RoleAllocation(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    role: str = Field(default="Engineer")
    hours: float = Field(default=0.0)
    rate: float = Field(default=0.0)
    cost: float = Field(default=0.0)


class PricingTier(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    total_hours: float = Field(
        default=0.0,
        validation_alias=AliasChoices("total_hours", "totalHours")
    )
    total_cost: float = Field(
        default=0.0,
        validation_alias=AliasChoices("total_cost", "totalCost")
    )
    role_breakdown: list[RoleAllocation] = Field(
        default_factory=list,
        validation_alias=AliasChoices("role_breakdown", "roleBreakdown")
    )
    rationale: str = Field(
        default="Estimation based on scope of work and active rate card.",
        validation_alias=AliasChoices("rationale", "reasoning", "description", "notes", "summary")
    )

class PricingResponse(BaseModel):
    tiers: dict[
        Literal["conservative", "standard", "aggressive"],
        PricingTier
    ]


# ============================================================
# DRAFT MODELS
# ============================================================

class SelectedPricing(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    tier_name: str = Field(default="standard", validation_alias=AliasChoices("tier_name", "tierName"))
    total_hours: float = Field(default=40.0, validation_alias=AliasChoices("total_hours", "totalHours"))
    total_cost: float = Field(default=4000.0, validation_alias=AliasChoices("total_cost", "totalCost"))
    role_breakdown: list[RoleAllocation] = Field(
        default_factory=list,
        validation_alias=AliasChoices("role_breakdown", "roleBreakdown")
    )
    rationale: str = Field(default="")

class DraftRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    tasks: list[str] = Field(default_factory=list)
    findings: list[ResearchFinding] = Field(default_factory=list)
    selected_pricing: SelectedPricing = Field(validation_alias=AliasChoices("selected_pricing", "selectedPricing"))


class DraftResponse(BaseModel):
    draft: str = Field(default="")

# ============================================================
# REVISION MODELS
# ============================================================

class ReviseRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    tasks: list[str] = Field(
        default_factory=list,
        description="Finalized task list from Planner"
    )
    findings: list[ResearchFinding] = Field(
        default_factory=list,
        description="Research findings from Researcher"
    )
    selected_pricing: SelectedPricing = Field(validation_alias=AliasChoices("selected_pricing", "selectedPricing"))
    previous_draft: str = Field(
        default="",
        description="Proposal draft that failed Reflector review",
        validation_alias=AliasChoices("previous_draft", "previousDraft")
    )
    revision_instructions: str = Field(
        default="",
        description="Specific corrections requested by Reflector",
        validation_alias=AliasChoices("revision_instructions", "revisionInstructions")
    )
    retry_attempt: int = Field(
        default=1,
        ge=0,
        description="Revision attempt number",
        validation_alias=AliasChoices("retry_attempt", "retryAttempt")
    )

class ReviseResponse(BaseModel):
    draft: str = Field(default="")

# ============================================================
# PRICING ENDPOINT
# ============================================================

@router.post(
    "/pricing",
    response_model=PricingResponse,
    status_code=status.HTTP_200_OK
)
async def estimate_pricing(
    request: PricingRequest
) -> PricingResponse:

    logger.info(
        "Executor pricing request received"
    )

    system_prompt = _load_prompt(
        "executor_pricing_prompt.txt"
    )

    user_prompt_data = {
        "tasks": request.tasks,
        "findings": [
            finding.model_dump()
            for finding in request.findings
        ],
        "rate_card": [
            item.model_dump()
            for item in request.rate_card
        ],
        "historical_data": [
            project.model_dump()
            for project in request.historical_data
        ]
    }

    raw = await llm_client.chat(
        system_prompt=system_prompt,
        user_prompt=json.dumps(
            user_prompt_data,
            indent=2
        ),
        temperature=0.2
    )

    try:
        data = extract_json(raw)
    except Exception as parse_err:
        logger.warning(
            "Initial JSON extraction failed (%s). Attempting retry with corrective prompt...",
            parse_err
        )
        try:
            raw_retry = await llm_client.chat(
                system_prompt=system_prompt,
                user_prompt="CRITICAL: Return ONLY a valid JSON object matching the required tiers schema with no markdown or formatting errors. Input data:\n"
                + json.dumps(user_prompt_data, indent=2),
                temperature=0.1
            )
            data = extract_json(raw_retry)
        except Exception as retry_err:
            logger.error("JSON extraction retry failed (%s). Constructing fallback tiers from rate card...", retry_err)
            task_count = max(1, len(request.tasks))
            default_rate = request.rate_card[0].price if request.rate_card else 100.0
            base_hours = float(task_count * 8.0)
            base_cost = base_hours * default_rate
            data = {
                "tiers": {
                    "conservative": {
                        "total_hours": round(base_hours * 1.2, 1),
                        "total_cost": round(base_cost * 1.2, 2),
                        "role_breakdown": [{"role": "Senior Engineer", "hours": round(base_hours * 1.2, 1), "rate": default_rate, "cost": round(base_cost * 1.2, 2)}],
                        "rationale": "Conservative estimate based on task roadmap with 20% risk buffer."
                    },
                    "standard": {
                        "total_hours": round(base_hours * 1.1, 1),
                        "total_cost": round(base_cost * 1.1, 2),
                        "role_breakdown": [{"role": "Senior Engineer", "hours": round(base_hours * 1.1, 1), "rate": default_rate, "cost": round(base_cost * 1.1, 2)}],
                        "rationale": "Standard estimate derived from task breakdown and rate card."
                    },
                    "aggressive": {
                        "total_hours": round(base_hours, 1),
                        "total_cost": round(base_cost * 0.95, 2),
                        "role_breakdown": [{"role": "Senior Engineer", "hours": round(base_hours, 1), "rate": default_rate * 0.95, "cost": round(base_cost * 0.95, 2)}],
                        "rationale": "Aggressive estimate with minimal buffer and competitive rate."
                    }
                }
            }

    # Normalize structure if LLM outputs tiers at root level
    if isinstance(data, dict):
        if "conservative" in data or "standard" in data or "aggressive" in data:
            data = {"tiers": data}

        if "tiers" in data and isinstance(data["tiers"], dict):
            # Lowercase keys
            data["tiers"] = {str(k).lower(): v for k, v in data["tiers"].items()}

            # Ensure all 3 tiers exist
            tiers = data["tiers"]
            base_tier = tiers.get("standard") or tiers.get("conservative") or tiers.get("aggressive")
            if base_tier and isinstance(base_tier, dict):
                if "standard" not in tiers:
                    tiers["standard"] = dict(base_tier)
                if "conservative" not in tiers:
                    c = dict(base_tier)
                    c["total_hours"] = round(float(c.get("total_hours", 40)) * 1.2, 1)
                    c["total_cost"] = round(float(c.get("total_cost", 4000)) * 1.2, 2)
                    c["rationale"] = "Conservative tier with 20% buffer."
                    tiers["conservative"] = c
                if "aggressive" not in tiers:
                    a = dict(base_tier)
                    a["total_hours"] = round(float(a.get("total_hours", 40)), 1)
                    a["total_cost"] = round(float(a.get("total_cost", 4000)) * 0.95, 2)
                    a["rationale"] = "Aggressive tier with 5% discount."
                    tiers["aggressive"] = a

    return PricingResponse.model_validate(data)


# ============================================================
# DRAFT ENDPOINT
# ============================================================

@router.post(
    "/draft",
    response_model=DraftResponse,
    status_code=status.HTTP_200_OK
)
async def generate_draft(
    request: DraftRequest
) -> DraftResponse:

    logger.info(
        "Executor draft generation request received"
    )

    system_prompt = _load_prompt(
        "executor_draft_prompt.txt"
    )

    user_prompt_data = {
        "tasks": request.tasks,
        "findings": [
            finding.model_dump()
            for finding in request.findings
        ],
        "selected_pricing": request.selected_pricing.model_dump()
    }

    raw = await llm_client.chat(
        system_prompt=system_prompt,
        user_prompt=json.dumps(
            user_prompt_data,
            indent=2
        ),
        temperature=0.3
    )

    try:
        data = extract_json(raw)
        if isinstance(data, dict) and "draft" in data:
            return DraftResponse.model_validate(data)
    except Exception:
        pass

    # If raw response is direct markdown proposal text
    return DraftResponse(draft=raw.strip())


# ============================================================
# REVISION ENDPOINT
# ============================================================

@router.post(
    "/revise",
    response_model=ReviseResponse,
    status_code=status.HTTP_200_OK
)
async def revise_draft(
    request: ReviseRequest
) -> ReviseResponse:

    logger.info(
        "Executor revision request received. Retry attempt: %s",
        request.retry_attempt
    )
    system_prompt = _load_prompt(
        "executor_revision_prompt.txt"
    )
    user_prompt_data = {
        "tasks": request.tasks,
        "findings": [
            finding.model_dump()
            for finding in request.findings
        ],
        "selected_pricing": request.selected_pricing.model_dump(),
        "previous_draft": request.previous_draft,
        "revision_instructions": request.revision_instructions,
        "retry_attempt": request.retry_attempt
    }
    raw = await llm_client.chat(
        system_prompt=system_prompt,
        user_prompt=json.dumps(
            user_prompt_data,
            indent=2
        ),
        temperature=0.2
    )

    try:
        data = extract_json(raw)
        if isinstance(data, dict) and "draft" in data:
            return ReviseResponse.model_validate(data)
    except Exception:
        pass

    # If raw response is direct markdown proposal text
    return ReviseResponse(draft=raw.strip())