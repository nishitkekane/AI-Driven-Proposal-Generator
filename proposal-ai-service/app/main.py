import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.reflect import router as reflect_router
from app.api.plan import router as plan_router
from app.api.research import router as research_router
from app.api.execute import router as execute_router

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Proposal AI Service",
    description=(
        "Multi-agent AI microservice for the Smart Proposal Generator.\n\n"
        "**Agents:**\n"
        "- **Planner Agent** (`POST /plan`) — HITL two-phase planning pipeline.\n"
        "  - Phase 1: Detect blocking ambiguities in requirements.\n"
        "  - Phase 2: Finalize implementation task list using user's clarification answers.\n\n"
        "- **Researcher Agent** (`POST /research`) — Scoped web research pipeline.\n"
        "  - Derives search queries from the task list.\n"
        "  - Runs web searches and synthesizes task-anchored findings.\n"
    ),
    version="2.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(plan_router,     prefix="/plan",     tags=["Planner Agent"])
app.include_router(research_router, prefix="/research", tags=["Researcher Agent"])
app.include_router(execute_router,  prefix="/execute", tags=["Executor Agents"])
app.include_router(reflect_router, prefix="/reflect", tags=["Reflector Agent"])
# ── Health & Root ─────────────────────────────────────────────────────────────

@app.get("/", tags=["Root"])
async def root():
    return {
        "service": "Proposal AI Service",
        "version": "2.0.0",
        "status": "running",
        "agents": ["Planner Agent (/plan)", "Researcher Agent (/research)"],
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "UP"}