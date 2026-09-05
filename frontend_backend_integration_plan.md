# Implementation Plan: Full Frontend ↔ Backend Integration

Wires the React frontend completely to the Spring Boot + FastAPI backend using the real async WebSocket-driven multi-agent workflow, replacing all legacy direct API calls and mock/static data.

---

## Background

| Layer | Readiness | Notes |
|---|---|---|
| FastAPI AI Service | ✅ Complete | All 4 agents fully operational |
| Spring Boot Backend | ✅ Complete | All endpoints, DTOs, orchestrator, scoped WebSockets |
| React Frontend | ⚠️ 40% Integrated | Auth works; workflow uses legacy direct-call; no WebSocket; Executor/Reflector/Pricing/Draft stages missing from UI |

---

## User Review Required

> **IMPORTANT — Complete workflow state replacement**: The current `Dashboard.jsx` calls `/api/plans/generate` and `/api/research` directly. After this plan the **entire flow shifts** to:
> 1. Create a Proposal record via `POST /api/proposals`
> 2. Open a WebSocket `ws://localhost:8080/ws/workflow?proposalId=<UUID>`
> 3. Trigger `POST /api/workflow/start/{id}` — **all subsequent state comes through WebSocket events**

> **WARNING — Mock data removal**: `FinalizePanel.jsx` and `ProposalEditor.jsx` are driven by `INITIAL_PROPOSAL_DATA` mock. The mock `items[]` table is different from the backend's `draftProposal` string. The table editor is replaced with a **markdown proposal reviewer** + **role-breakdown table** from real Executor tier data.

---

## Open Questions

1. **Proposal List Page**: Should `GET /api/proposals` be surfaced as a "My Proposals" history page from the Navbar, or is the dashboard always a single active session?
2. **Session Resume**: If the user refreshes mid-workflow, should the app auto-resume from the last `proposalId` stored in sessionStorage?

---

## Proposed Changes

---

### Component 1: API Service Layer

#### [MODIFY] `frontend/src/services/api.js`

Add 7 new functions. All use the existing `request()` helper with JWT.

**Proposal Management:**
```js
createProposal({ title, customerRequirement })
// POST /api/proposals → ProposalResponseDto { id, title, status, createdAt, ... }

getProposal(id)
// GET /api/proposals/{id}

getAllProposals()
// GET /api/proposals → ProposalResponseDto[]
```

**Workflow Triggers (fire-and-forget; results arrive via WebSocket):**
```js
startWorkflow(proposalId)
// POST /api/workflow/start/{proposalId}

submitClarifications(proposalId, answers, ambiguities)
// POST /api/workflow/clarify/{proposalId}
// Body: { answers: string[], ambiguities: string[] }

finalizePricing(proposalId, { tierName, totalHours, totalCost, roleBreakdown, rationale })
// POST /api/workflow/pricing/{proposalId}

approveProposal(proposalId, finalProposal)
// POST /api/workflow/approve/{proposalId}
// Body: { finalProposal: string }
```

---

### Component 2: WebSocket Hook

#### [NEW] `frontend/src/hooks/useWorkflowWebSocket.js`

Custom React hook managing the WebSocket lifecycle for a given `proposalId`.

**Responsibilities:**
- Connect to `ws://localhost:8080/ws/workflow?proposalId=<UUID>`
- Parse JSON: `{ proposalId, status, payload }`
- Call `onMessage(status, payload)` on each event
- Reconnect on unexpected close (exponential backoff, up to 3 retries)
- Clean up on unmount

**Returns:** `{ isConnected, disconnect }`

#### Complete WebSocket Event Reference

| `status` | `payload` |
|---|---|
| `planner_phase1_running` | `null` |
| `ambiguities_received` | `{ ambiguities: string[] }` |
| `planner_phase2_running` | `null` |
| `researcher_running` | `null` |
| `pricing_calculating` | `null` |
| `pending_pricing` | `{ tiers: { conservative, standard, aggressive }, tasks: string[], findings: [...] }` |
| `drafting_proposal` | `null` |
| `revising_draft` | `{ retryAttempt: number }` |
| `pending_draft_approval` | `{ draft: string, passed_reflection: bool, overall_score: number, reflector_warnings: string[], retry_count: number }` |
| `completed` | `null` |
| `error` | `{ error: string }` |

---

### Component 3: Extended AI Execution Timeline

#### [MODIFY] `frontend/src/components/Workspace/AIExecutionTimeline.jsx`

Expand `STAGES` array from 3 → **8 stages**:

| # | Stage ID | Agent | `activeOn` | `doneOn` |
|---|---|---|---|---|
| 1 | `planner1` | Planner Agent — Phase 1 | `planner_phase1_running` | `ambiguities_received`+ |
| 2 | `hitl_clarify` | Human-in-the-Loop — Clarification | `ambiguities_received` | `planner_phase2_running`+ |
| 3 | `researcher` | Researcher Agent | `planner_phase2_running`, `researcher_running` | `pricing_calculating`+ |
| 4 | `executor_pricing` | Executor Agent — 3-Tier Pricing | `pricing_calculating` | `pending_pricing`+ |
| 5 | `hitl_pricing` | Human-in-the-Loop — Tier Selection | `pending_pricing` | `drafting_proposal`+ |
| 6 | `executor_draft` | Executor Agent — Proposal Drafting | `drafting_proposal`, `revising_draft` | `pending_draft_approval`+ |
| 7 | `reflector` | Reflector Agent — Adversarial Review | `revising_draft` | `pending_draft_approval`+ |
| 8 | `hitl_approve` | Human-in-the-Loop — Final Approval | `pending_draft_approval` | `completed` |

**Additional:**
- Accept `reflectorStats` prop `{ overallScore, passedReflection, retryCount }`.
- Show **retry badge** during `revising_draft`: `"Revision #2…"`
- Show **score badge** after Reflector done: `"87/100 ✓ PASS"` (emerald ≥80, amber 60-79, red <60).

---

### Component 4: Pricing Tier Selector Panel

#### [NEW] `frontend/src/components/Workspace/PricingTierPanel.jsx`

Rendered in right column when `status === 'pending_pricing'`.

**Props:** `{ tiers, tasks, findings, onConfirm, isSubmitting }`

```
┌─────────────────────────────────────────────────┐
│ 💰 Executor Agent — 3-Tier Pricing              │
├──────────────┬──────────────┬───────────────────┤
│ Conservative │  Standard ★  │    Aggressive     │
│ $XX,000      │  $XX,000     │    $XX,000        │
│ XXX hrs      │  XXX hrs     │    XXX hrs        │
├─────────────────────────────────────────────────┤
│ [Selected tier: Role Breakdown table]           │
│ Role          | Hours | Rate  | Cost            │
│ Backend Eng.  |  40h  | $150  | $6,000         │
│ UI Developer  |  20h  | $120  | $2,400         │
├─────────────────────────────────────────────────┤
│ Rationale: "Standard tier balances..."          │
├─────────────────────────────────────────────────┤
│  [Confirm Pricing & Generate Draft]  (emerald)  │
└─────────────────────────────────────────────────┘
```

On confirm → sends `PricingSelectionDto` to `/api/workflow/pricing/{proposalId}`.

---

### Component 5: Draft Review & Approval Panel

#### [NEW] `frontend/src/components/Workspace/DraftApprovalPanel.jsx`

Rendered when `status === 'pending_draft_approval'`.

**Props:** `{ draft, passedReflection, overallScore, reflectorWarnings, retryCount, proposalId, onApproved, isSubmitting }`

```
┌─────────────────────────────────────────────────┐
│ 🛡️ Reflector Agent — Quality Review             │
│  [Score Ring: 87/100]  ● PASS ✓                │
│  Passed after 2 revision cycles                 │
│                                                 │
│ ▲ Reflector Warnings (2)                        │
│  ⚠ "Pricing rationale could be stronger..."    │
│  ⚠ "Missing timeline for Phase 2..."           │
├─────────────────────────────────────────────────┤
│ 📄 Generated Proposal Draft (editable textarea) │
│  [User can edit the AI draft before approving]  │
├─────────────────────────────────────────────────┤
│  [Approve & Finalize Proposal]  (emerald)       │
└─────────────────────────────────────────────────┘
```

On approve → `approveProposal(proposalId, editedDraftText)`.

---

### Component 6: Finalize Panel Rewire

#### [MODIFY] `frontend/src/components/Workspace/FinalizePanel.jsx`

**New props:** `{ proposalId, finalProposal, selectedPricing, title }`

**Changes:**
- Remove all `proposalData.items` table (mock structure).
- Show: tier name, `selectedPricing.totalCost`, `selectedPricing.totalHours`.
- Export uses real `finalProposal` string.
- Add "Copy to Clipboard" button.
- Remove all `INITIAL_PROPOSAL_DATA` references.

---

### Component 7: Dashboard Orchestration Rewrite

#### [MODIFY] `frontend/src/components/Workspace/Dashboard.jsx`

Complete replacement of direct-API sequential pattern with WebSocket-driven state machine.

**New state:**
```js
const [proposalId, setProposalId]           = useState(null);
const [status, setStatus]                   = useState('idle');
const [error, setError]                     = useState('');
const [ambiguities, setAmbiguities]         = useState([]);
const [tasks, setTasks]                     = useState([]);
const [findings, setFindings]               = useState([]);
const [pricingTiers, setPricingTiers]       = useState(null);
const [selectedPricing, setSelectedPricing] = useState(null);
const [draftData, setDraftData]             = useState(null);
const [finalProposal, setFinalProposal]     = useState('');
const [reflectorStats, setReflectorStats]   = useState(null);
const [retryAttempt, setRetryAttempt]       = useState(0);
```

**`handleGenerate` — new flow:**
```
1. buildText(formData)  — same helper as before
2. POST /api/proposals → receive { id }
3. setProposalId(id)
4. useWorkflowWebSocket(id, handleWsMessage)  — opens WS
5. POST /api/workflow/start/{id}
6. setStatus('planner_phase1_running')
```

**`handleWsMessage(wsStatus, payload)`:**
```
'ambiguities_received'   → setAmbiguities(payload.ambiguities)
'pending_pricing'        → setPricingTiers(payload.tiers)
                           setTasks(payload.tasks)
                           setFindings(payload.findings)
'revising_draft'         → setRetryAttempt(payload.retryAttempt)
'pending_draft_approval' → setDraftData({ draft, passedReflection,
                             overallScore, reflectorWarnings, retryCount })
                           setReflectorStats(...)
'error'                  → setError(payload.error)
Always                   → setStatus(wsStatus)
```

**HITL handlers:**
```js
handleAnswersSubmit(answers) {
  submitClarifications(proposalId, answers, ambiguities)
}
handlePricingConfirm(tierName, tierData) {
  setSelectedPricing({ tierName, ...tierData })
  finalizePricing(proposalId, { tierName, ...tierData })
}
handleProposalApprove(editedText) {
  approveProposal(proposalId, editedText)
  setFinalProposal(editedText)
}
```

**`renderRightPanel()` — full switch table:**

| `status` | Renders |
|---|---|
| `idle` | `<IdleHint />` |
| `planner_phase1_running` | `<SpinnerOverlay label="Planner Agent analysing requirements…" />` |
| `ambiguities_received` | `<ClarificationPanel ambiguities onSubmit={handleAnswersSubmit} />` |
| `planner_phase2_running` | `<SpinnerOverlay label="Finalizing plan with your answers…" />` |
| `researcher_running` | `<SpinnerOverlay label="Researcher Agent gathering facts from the web…" />` |
| `pricing_calculating` | `<SpinnerOverlay label="Executor Agent calculating 3-tier pricing…" />` |
| `pending_pricing` | `<PricingTierPanel tiers tasks findings onConfirm={handlePricingConfirm} />` |
| `drafting_proposal` | `<SpinnerOverlay label="Executor Agent drafting proposal…" />` |
| `revising_draft` | `<SpinnerOverlay label={"Reflector revising — Attempt " + retryAttempt + "…"} />` |
| `pending_draft_approval` | `<DraftApprovalPanel {...draftData} proposalId onApproved={handleProposalApprove} />` |
| `completed` | `<FinalizePanel proposalId finalProposal selectedPricing title />` |
| `error` | `<ErrorBanner message={error} />` |

---

### Component 8: App Routes (P2 — Optional)

#### [MODIFY] `frontend/src/App.jsx`

```jsx
<Route path="/proposals"     element={<ProposalsListPage />} />
<Route path="/dashboard"     element={<Dashboard />} />
```

---

## File Change Summary

| File | Action | Priority |
|---|---|---|
| `services/api.js` | MODIFY — 7 new workflow functions | **P0** |
| `hooks/useWorkflowWebSocket.js` | **NEW** — WS lifecycle hook | **P0** |
| `Workspace/Dashboard.jsx` | MODIFY — full state machine rewrite | **P0** |
| `Workspace/AIExecutionTimeline.jsx` | MODIFY — 8-stage pipeline + score badge | **P1** |
| `Workspace/PricingTierPanel.jsx` | **NEW** — 3-tier selector + role breakdown | **P1** |
| `Workspace/DraftApprovalPanel.jsx` | **NEW** — Reflector score + editable draft + approve | **P1** |
| `Workspace/FinalizePanel.jsx` | MODIFY — real data, remove mock | **P1** |
| `App.jsx` | MODIFY — proposals history route | P2 |

---

## Verification Plan

### Build Checks
```powershell
# Backend
mvn -f "c:\Users\Nishit Kekane\Devzone\Smart_Proposal_Generation\Project\backend\pom.xml" compile

# Frontend
npm --prefix "c:\Users\Nishit Kekane\Devzone\Smart_Proposal_Generation\Project\frontend" run build
```

### Manual E2E Test Sequence
1. **Login** → JWT stored in `localStorage`
2. **Create Proposal** → `POST /api/proposals` returns UUID
3. **WebSocket** → DevTools → Network → WS shows connection with `?proposalId=<UUID>`
4. **Phase 1** → Timeline: Planner running → pauses at Clarification Q&A
5. **Clarifications** → Fill answers → Researcher → Executor Pricing progresses in timeline
6. **Pricing Panel** → 3 tier cards with role breakdowns; select one → Confirm Pricing
7. **Draft + Reflector** → Timeline: Drafting → Reflector reviewing (retry badge if FAIL loop)
8. **Draft Approval** → Score badge visible; edit draft if needed → Approve & Finalize
9. **Export** → Finalize panel shows real content; .txt export works
