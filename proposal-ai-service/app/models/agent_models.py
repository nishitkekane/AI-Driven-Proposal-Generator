from typing import Any

from pydantic import BaseModel, Field


class AgentContext(BaseModel):
    """
    Shared context exchanged between agents.
    """

    requirement: str

    metadata: dict[str, Any] = Field(default_factory=dict)