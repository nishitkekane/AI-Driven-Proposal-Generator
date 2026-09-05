"""
Researcher Agent Endpoint
=========================

POST /research

Three-step internal pipeline:
1. Query Derivation  — LLM derives 3–5 focused search queries from the task list + context.
2. Web Search — Queries are run via the configured search provider (Tavily / DDG).
3. Filter + Synthesize — LLM applies strict rules to filter snippets and produce task-anchored findings with confidence scores.
"""
import json

from app.services.json_utils import extract_json
import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException, status

from app.models.request_models import ResearchContext, ResearchRequest
from app.models.response_models import ResearchResponse
from app.services.llm_client import LLMClient
from app.services.llm_exceptions import LLMError
from app.services import web_search
from app.config import settings

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

# ── Step 1: Query Derivation ──────────────────────────────────────────────────

QUERY_DERIVATION_PROMPT = """\
You are a research query planner. Given a project task list and context, \
derive a compact set of highly specific web search queries that will \
surface real-world facts (pricing, vendor options, compliance standards, \
technical specifications, lead times, about client & competitors and many more things which may be relevant for that specific case) needed to support those tasks.

RULES:
1. Each query must be directly traceable to at least one task.[this is not always necessary in case we are finding some queries which are more inclined towards the business aspect]
2. Queries must be specific enough to return factual results, not generic topics.
3. Do NOT generate queries for tasks that need no external research \
   (e.g. "write unit tests", "set up CI/CD pipeline").
4. Maximum {max_queries} queries. Prioritise the highest-value ones.
5. Output ONLY a raw JSON object with a key "queries" containing a list of query strings. No markdown, no explanations.

Example output:
{{
  "queries": [
    "AS9100 Rev D certified titanium Ti-6Al-4V forging suppliers 2025",
    "SAP S/4HANA REST API integration cost estimate",
    "ISO 9001 2015 aerospace vendor qualification checklist"
  ]
}}
"""


def _build_task_context_prompt(
    tasks: list[str],
    context: ResearchContext,
) -> str:
    """Build the user prompt for query derivation."""
    numbered_tasks = "\n".join(f"{i + 1}. {t}" for i, t in enumerate(tasks))
    ctx_parts = []
    if context.project_title:
        ctx_parts.append(f"Project: {context.project_title}")
    if context.client_name:
        ctx_parts.append(f"Client: {context.client_name}")
    if context.industry:
        ctx_parts.append(f"Industry: {context.industry}")
    if context.budget_range:
        ctx_parts.append(f"Budget: {context.budget_range}")
    if context.deadline:
        ctx_parts.append(f"Deadline: {context.deadline}")

    ctx_block = "\n".join(ctx_parts) if ctx_parts else "No additional context provided."
    return (
        f"--- Project Context ---\n{ctx_block}\n\n"
        f"--- Task List ---\n{numbered_tasks}"
    )


async def _derive_queries(
    tasks: list[str],
    context: ResearchContext,
) -> list[str]:
    """Ask the LLM to derive the most relevant search queries for this task list."""
    system_prompt = QUERY_DERIVATION_PROMPT.format(max_queries=settings.max_search_queries)
    user_prompt = _build_task_context_prompt(tasks, context)

    try:
        raw = await llm_client.chat(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.2,
        )
        data = extract_json(raw)
        if isinstance(data, dict):
            queries = data.get("queries", [])
        elif isinstance(data, list):
            queries = data
        else:
            queries = []
        logger.info("Query derivation produced %d queries.", len(queries))
        return [str(q) for q in queries if q]
    except (json.JSONDecodeError, TypeError) as exc:
        logger.warning("Query derivation JSON parse failed: %s — raw: %r", exc, raw)
        return []
    except LLMError as exc:
        logger.error("LLM failed during query derivation: %s", exc)
        return []


# ── Step 2: Web Search (delegated to web_search service) ─────────────────────

# (imported above as `web_search`)


# ── Step 3: Filter + Synthesize ───────────────────────────────────────────────

def _build_synthesis_user_prompt(
    tasks: list[str],
    snippets: list[web_search.SearchResult],
) -> str:
    """Combine the task list and raw snippets into the synthesis user prompt with size guardrails."""
    numbered_tasks = "\n".join(f"{i + 1}. {t}" for i, t in enumerate(tasks))

    # Deduplicate and limit to top 8 snippets
    seen_urls = set()
    unique_snippets = []
    for s in snippets:
        if s.url and s.url not in seen_urls:
            seen_urls.add(s.url)
            unique_snippets.append(s)
        elif not s.url and s not in unique_snippets:
            unique_snippets.append(s)
        if len(unique_snippets) >= 8:
            break

    snippets_block = ""
    for idx, s in enumerate(unique_snippets, start=1):
        # Truncate each snippet body to 350 chars to avoid 413 Payload Too Large
        clean_text = (s.snippet or "").strip()
        if len(clean_text) > 350:
            clean_text = clean_text[:350] + "..."

        snippets_block += (
            f"\n--- Snippet {idx} ---\n"
            f"Title: {s.title[:100]}\n"
            f"URL: {s.url}\n"
            f"Text: {clean_text}\n"
        )

    return (
        f"--- Task List ---\n{numbered_tasks}\n\n"
        f"--- Web Search Snippets ---\n{snippets_block}"
    )


async def _synthesize(
    tasks: list[str],
    snippets: list[web_search.SearchResult],
) -> ResearchResponse:
    """
    Run the researcher synthesis prompt over the task list + snippets.
    Returns a structured ResearchResponse.
    """
    if not snippets:
        logger.warning("No snippets to synthesize — returning empty ResearchResponse.")
        return ResearchResponse(findings=[], sources=[])

    system_prompt = _load_prompt("researcher_prompt.txt")
    user_prompt = _build_synthesis_user_prompt(tasks, snippets)

    try:
        raw = await llm_client.chat(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.1,  # Lower temp for factual synthesis
        )
        data = extract_json(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Researcher returned invalid JSON during synthesis: {exc}",
        )
    except LLMError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"LLM call failed during research synthesis: {exc}",
        )

    findings_raw = data.get("findings", [])
    sources_raw = data.get("sources", [])

    sanitized_findings = []
    if isinstance(findings_raw, list):
        for item in findings_raw:
            if isinstance(item, dict):
                conf = str(item.get("confidence", "medium")).lower().strip()
                if conf not in ("high", "medium", "low"):
                    conf = "medium"
                sanitized_findings.append({
                    "task_reference": str(item.get("task_reference") or item.get("taskReference") or "General"),
                    "insight": str(item.get("insight") or ""),
                    "confidence": conf,
                })
            elif isinstance(item, str) and item.strip():
                sanitized_findings.append({
                    "task_reference": "General",
                    "insight": item.strip(),
                    "confidence": "medium",
                })

    sanitized_sources = []
    if isinstance(sources_raw, list):
        for item in sources_raw:
            if isinstance(item, dict):
                url = str(item.get("url") or "").strip()
                if url:
                    sanitized_sources.append({
                        "title": str(item.get("title") or "Web Source"),
                        "url": url,
                        "relevance": str(item.get("relevance") or "Research reference"),
                    })
            elif isinstance(item, str) and item.strip().startswith("http"):
                sanitized_sources.append({
                    "title": "Web Source",
                    "url": item.strip(),
                    "relevance": "Referenced in research findings",
                })

    logger.info(
        "Synthesis complete — %d findings, %d sources.",
        len(sanitized_findings),
        len(sanitized_sources),
    )

    return ResearchResponse(
        findings=sanitized_findings,
        sources=sanitized_sources,
    )


# ── Router ────────────────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=ResearchResponse,
    status_code=status.HTTP_200_OK,
    summary="Researcher Agent",
    description=(
        "Performs a three-step research pipeline: "
        "(1) derives focused search queries from the task list, "
        "(2) runs web searches, "
        "(3) filters and synthesizes results into task-anchored findings with confidence scores."
    ),
)
async def research(request: ResearchRequest) -> ResearchResponse:
    """
    Researcher Agent — executes web research scoped strictly to the provided task list.
    """
    tasks = request.tasks
    context = request.context

    logger.info(
        "Research request: %d tasks, provider='%s'",
        len(tasks),
        settings.search_provider,
    )

    # Step 1 — Derive search queries
    queries = await _derive_queries(tasks, context)

    if not queries:
        logger.warning(
            "No search queries derived from task list. "
            "Returning empty research response."
        )
        return ResearchResponse(findings=[], sources=[])

    # Step 2 — Execute web searches
    try:
        snippets = await web_search.search(queries)
    except Exception as exc:
        logger.error("Web search failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Web search failed: {exc}",
        )

    logger.info("Web search returned %d total snippets.", len(snippets))

    # Step 3 — Filter and synthesize
    return await _synthesize(tasks, snippets)
