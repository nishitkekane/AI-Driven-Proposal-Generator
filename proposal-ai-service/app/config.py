from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application configuration loaded from environment variables / .env file.
    """

    # ── LLM ───────────────────────────────────────────────────────────────────
    groq_api_key: str = ""
    base_url: str = "https://api.groq.com/openai/v1"
    model: str = "llama-3.3-70b-versatile"
    request_timeout: int = 60

    # ── Web Search ────────────────────────────────────────────────────────────
    # Set SEARCH_PROVIDER to "tavily" (requires TAVILY_API_KEY) or
    # "ddg" for DuckDuckGo (free, no key required).
    search_provider: str = "tavily"
    tavily_api_key: str = "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"

    # Max number of search queries derived per research request.
    # Increase for richer results; decrease for speed.
    max_search_queries: int = 5

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Returns a cached Settings instance."""
    return Settings()


settings = get_settings()