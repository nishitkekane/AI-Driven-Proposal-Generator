"""
Web Search Service
==================
Async wrapper around web search providers.

Supported providers (configured via SEARCH_PROVIDER env var):
  - "tavily"  : Tavily AI Search API (requires TAVILY_API_KEY)
  - "ddg"     : DuckDuckGo (free, no key required, rate-limited)

Each provider returns a list of SearchResult objects:
    { title: str, url: str, snippet: str }
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

MAX_RESULTS_PER_QUERY = 2  # snippets fetched per search query


@dataclass
class SearchResult:
    title: str
    url: str
    snippet: str


# ── Provider: Tavily ──────────────────────────────────────────────────────────

async def _search_tavily(queries: list[str]) -> list[SearchResult]:
    """
    Run queries via the Tavily Search API.
    Docs: https://docs.tavily.com/docs/rest-api/api-reference
    """
    api_key = settings.tavily_api_key
    if not api_key:
        raise ValueError(
            "SEARCH_PROVIDER is set to 'tavily' but TAVILY_API_KEY is not configured."
        )

    results: list[SearchResult] = []
    async with httpx.AsyncClient(timeout=20) as client:
        for query in queries:
            try:
                response = await client.post(
                    "https://api.tavily.com/search",
                    json={
                        "api_key": api_key,
                        "query": query,
                        "search_depth": "basic",
                        "max_results": MAX_RESULTS_PER_QUERY,
                        "include_answer": False,
                        "include_raw_content": False,
                    },
                )
                response.raise_for_status()
                data = response.json()
                for item in data.get("results", []):
                    results.append(
                        SearchResult(
                            title=item.get("title", ""),
                            url=item.get("url", ""),
                            snippet=item.get("content", ""),
                        )
                    )
            except httpx.HTTPError as exc:
                logger.warning("Tavily search failed for query '%s': %s", query, exc)

    return results


# ── Provider: DuckDuckGo ──────────────────────────────────────────────────────

async def _search_ddg(queries: list[str]) -> list[SearchResult]:
    """
    Run queries via the DuckDuckGo Search library (duckduckgo-search).
    Free — no API key required. Results may be rate-limited under heavy usage.
    """
    try:
        from duckduckgo_search import DDGS  # type: ignore
    except ImportError as exc:
        raise ImportError(
            "duckduckgo-search is not installed. "
            "Run: pip install duckduckgo-search"
        ) from exc

    results: list[SearchResult] = []
    # DDGS is synchronous; we run it in a thread pool to stay async-safe.
    import asyncio
    loop = asyncio.get_event_loop()

    def _run_ddg_queries() -> list[SearchResult]:
        collected: list[SearchResult] = []
        with DDGS() as ddgs:
            for query in queries:
                try:
                    hits = list(
                        ddgs.text(
                            query,
                            max_results=MAX_RESULTS_PER_QUERY,
                            safesearch="off",
                        )
                    )
                    for hit in hits:
                        collected.append(
                            SearchResult(
                                title=hit.get("title", ""),
                                url=hit.get("href", ""),
                                snippet=hit.get("body", ""),
                            )
                        )
                except Exception as exc:
                    logger.warning(
                        "DDG search failed for query '%s': %s", query, exc
                    )
        return collected

    results = await loop.run_in_executor(None, _run_ddg_queries)
    return results


# ── Public interface ──────────────────────────────────────────────────────────

async def search(queries: list[str]) -> list[SearchResult]:
    """
    Run a list of search queries using the configured provider.

    Args:
        queries: List of search query strings (derived from the task list).

    Returns:
        Flat list of SearchResult objects from all queries combined.
    """
    provider = settings.search_provider.lower()

    if not queries:
        return []

    # Cap the number of queries to avoid excessive API usage
    capped = queries[: settings.max_search_queries]
    logger.info(
        "Running %d search queries via provider '%s'", len(capped), provider
    )

    if provider == "tavily":
        return await _search_tavily(capped)
    elif provider == "ddg":
        return await _search_ddg(capped)
    else:
        raise ValueError(
            f"Unknown SEARCH_PROVIDER '{provider}'. "
            "Supported values: 'tavily', 'ddg'."
        )
