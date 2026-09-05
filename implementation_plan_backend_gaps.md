# Implementation Plan: Backend Proposal Management, DTOs, Scoped WebSocket & Data Integration

This plan addresses the identified gaps in the Spring Boot backend to support end-to-end proposal creation, proposal-specific WebSocket communication, historical job & rate card data integration, and strongly-typed DTOs for workflow checkpoints.

---

## User Review Required

> [!IMPORTANT]
> - **WebSocket Proposal Scoping**: Clients will connect with a query parameter `ws://localhost:8080/ws/workflow?proposalId=<UUID>`. The handler will map connections per `proposalId` and broadcast events only to sessions subscribed to that specific proposal.
> - **Proposal Initial Creation**: We will introduce `ProposalController` and `ProposalService` exposing `POST /api/proposals` so the frontend can create a proposal record and obtain its `proposalId` prior to triggering `/api/workflow/start/{proposalId}`.
> - **Security / Route Access**: `/api/proposals/**` and `/api/workflow/**` routes will be explicitly permitted in `SecurityConfig.java` to ensure smooth frontend and WebSocket integration.

---

## Proposed Changes

### Component 1: DTO Layer (Request & Response Bodies)

#### [NEW] [`ProposalCreateRequestDto.java`](file:///c:/Users/Nishit%20Kekane/Devzone/Smart_Proposal_Generation/Project/backend/src/main/java/com/proposal/backend/dto/ProposalCreateRequestDto.java)
- Fields: `title` (`@NotBlank`), `customerRequirement` (`@NotBlank`), `userId` (optional `UUID`).

#### [NEW] [`ProposalResponseDto.java`](file:///c:/Users/Nishit%20Kekane/Devzone/Smart_Proposal_Generation/Project/backend/src/main/java/com/proposal/backend/dto/ProposalResponseDto.java)
- Full view of the Proposal entity (id, title, requirement, status, timestamps, planTasks, researchFindings, pricingTiers, selectedPricing, draftProposal, finalProposal).

#### [NEW] [`ClarificationRequestDto.java`](file:///c:/Users/Nishit%20Kekane/Devzone/Smart_Proposal_Generation/Project/backend/src/main/java/com/proposal/backend/dto/ClarificationRequestDto.java)
- Fields: `List<String> answers`, `List<String> ambiguities`.

#### [NEW] [`PricingSelectionDto.java`](file:///c:/Users/Nishit%20Kekane/Devzone/Smart_Proposal_Generation/Project/backend/src/main/java/com/proposal/backend/dto/PricingSelectionDto.java)
- Structured model for user-selected pricing tier (tier name, total hours, total cost, role breakdown, rationale).

#### [NEW] [`ProposalApprovalDto.java`](file:///c:/Users/Nishit%20Kekane/Devzone/Smart_Proposal_Generation/Project/backend/src/main/java/com/proposal/backend/dto/ProposalApprovalDto.java)
- Fields: `finalProposal` (`@NotBlank`).

---

### Component 2: Proposal Controller & Service (Initial Creation Gap)

#### [NEW] [`ProposalService.java`](file:///c:/Users/Nishit%20Kekane/Devzone/Smart_Proposal_Generation/Project/backend/src/main/java/com/proposal/backend/service/ProposalService.java)
- `createProposal(ProposalCreateRequestDto dto)`: Creates a new `Proposal` with status `PENDING`, sets `createdAt`/`updatedAt`, saves to Neon PostgreSQL via `ProposalRepository`, and returns `ProposalResponseDto`.
- `getProposalById(UUID id)`: Retrieves proposal by UUID or throws 404 exception.
- `getAllProposals()`: Lists all proposals ordered by creation date descending.

#### [NEW] [`ProposalController.java`](file:///c:/Users/Nishit%20Kekane/Devzone/Smart_Proposal_Generation/Project/backend/src/main/java/com/proposal/backend/controller/ProposalController.java)
- `@RestController @RequestMapping("/api/proposals")`
- `POST /api/proposals` (creates proposal, returns 201 Created with `ProposalResponseDto`).
- `GET /api/proposals/{id}` (fetches proposal by UUID).
- `GET /api/proposals` (fetches all proposals).

---

### Component 3: Scoped WebSocket Communication

#### [MODIFY] [`WorkflowWebSocketHandler.java`](file:///c:/Users/Nishit%20Kekane/Devzone/Smart_Proposal_Generation/Project/backend/src/main/java/com/proposal/backend/config/WorkflowWebSocketHandler.java)
- Replace flat `sessions` map with `Map<UUID, Set<WebSocketSession>> proposalSessions = new ConcurrentHashMap<>()`.
- In `afterConnectionEstablished`: parse `proposalId` from query string (`session.getUri().getQuery()`) and register session into the set for that `proposalId`.
- In `afterConnectionClosed`: remove the session from the corresponding `proposalId` set.
- Implement `sendToProposal(UUID proposalId, String message)`: sends message **only** to sessions subscribed to that specific `proposalId`.

---

### Component 4: Orchestration, Job Lifecycle & RateCard/Historical Data

#### [MODIFY] [`AgentOrchestratorService.java`](file:///c:/Users/Nishit%20Kekane/Devzone/Smart_Proposal_Generation/Project/backend/src/main/java/com/proposal/backend/service/AgentOrchestratorService.java)
1. **Initial Job Tracking**: In `startWorkflow(UUID proposalId)`, create a `Job` record with status `STARTED` and `startedAt = LocalDateTime.now()`.
2. **Historical Data Extraction**: Query completed jobs from `jobRepository` & `proposalRepository` to populate historical projects list (title, tasks, actual duration hours).
3. **Fallback Graceful Handling**: Pass active rate cards and historical projects to FastAPI `/execute/pricing`. If no matching historical data exists, pass empty list so Executor Agent uses its industry-standard knowledge as instructed in the prompt.
4. **Targeted WebSocket Broadcasting**: Switch `notifyStatus(proposalId, status, payload)` to call `webSocketHandler.sendToProposal(proposalId, ...)`.
5. **Use Typed DTOs**: Update method signatures in `submitClarifications`, `finalizePricing`, and `approveProposal` to consume typed DTOs.

#### [MODIFY] [`WorkflowController.java`](file:///c:/Users/Nishit%20Kekane/Devzone/Smart_Proposal_Generation/Project/backend/src/main/java/com/proposal/backend/controller/WorkflowController.java)
- Refactor endpoints (`/clarify`, `/pricing`, `/approve`) to use `@Valid @RequestBody ClarificationRequestDto`, `PricingSelectionDto`, and `ProposalApprovalDto`.

---

### Component 5: Configuration & Security

#### [MODIFY] [`application.properties`](file:///c:/Users/Nishit%20Kekane/Devzone/Smart_Proposal_Generation/Project/backend/src/main/resources/application.properties)
- Add missing endpoint properties:
  ```properties
  fastapi.execute-pricing-url=http://127.0.0.1:8000/execute/pricing
  fastapi.execute-draft-url=http://127.0.0.1:8000/execute/draft
  ```

#### [MODIFY] [`SecurityConfig.java`](file:///c:/Users/Nishit%20Kekane/Devzone/Smart_Proposal_Generation/Project/backend/src/main/java/com/proposal/backend/config/SecurityConfig.java)
- Permit `/api/proposals/**` in the security filter chain alongside `/api/workflow/**` and `/ws/workflow/**`.

---

## Verification Plan

### Automated Tests / Code Build
- Run Maven compile:
  ```powershell
  mvn -f "c:\Users\Nishit Kekane\Devzone\Smart_Proposal_Generation\Project\backend\pom.xml" compile
  ```

### Manual Verification
1. **Create Proposal**: Send `POST /api/proposals` with sample payload `{ "title": "CRM Integration", "customerRequirement": "Build a CRM sync tool" }`. Verify response contains generated UUID and status `PENDING`.
2. **Retrieve Proposal**: Send `GET /api/proposals/{id}` and verify proposal is returned.
3. **Scoped WebSocket Connection**: Open WebSocket connection to `ws://localhost:8080/ws/workflow?proposalId=<UUID>`.
4. **Trigger Workflow**: Send `POST /api/workflow/start/{id}` and confirm that real-time notifications are pushed exclusively to the subscribed proposal session.
5. **Rate Card & Pricing Call**: Verify that `AgentOrchestratorService` reads rate cards and historical jobs, formats the payload, and sends it to FastAPI `/execute/pricing`.
