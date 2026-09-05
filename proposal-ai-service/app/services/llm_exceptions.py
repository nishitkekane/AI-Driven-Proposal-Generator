class LLMError(Exception):
    """Base exception for all LLM related failures."""


class LLMRequestError(LLMError):
    """Raised when the LLM request fails."""


class LLMResponseError(LLMError):
    """Raised when the LLM returns an invalid response."""