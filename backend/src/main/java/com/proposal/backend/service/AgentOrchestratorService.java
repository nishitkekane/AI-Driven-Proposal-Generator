package com.proposal.backend.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.proposal.backend.config.WorkflowWebSocketHandler;
import com.proposal.backend.dto.ClarificationRequestDto;
import com.proposal.backend.dto.PricingSelectionDto;
import com.proposal.backend.dto.ProposalApprovalDto;
import com.proposal.backend.entity.Job;
import com.proposal.backend.entity.Proposal;
import com.proposal.backend.entity.RateCard;
import com.proposal.backend.repository.JobRepository;
import com.proposal.backend.repository.ProposalRepository;
import com.proposal.backend.repository.RateCardRepository;

import tools.jackson.databind.ObjectMapper;

@Service
public class AgentOrchestratorService {

    private static final Logger logger = LoggerFactory.getLogger(AgentOrchestratorService.class);

    private final ProposalRepository proposalRepository;
    private final RateCardRepository rateCardRepository;
    private final JobRepository jobRepository;
    private final WorkflowWebSocketHandler webSocketHandler;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${fastapi.plan-url:http://127.0.0.1:8000/plan}")
    private String planUrl;

    @Value("${fastapi.research-url:http://127.0.0.1:8000/research}")
    private String researchUrl;

    @Value("${fastapi.execute-pricing-url:http://127.0.0.1:8000/execute/pricing}")
    private String executePricingUrl;

    @Value("${fastapi.execute-draft-url:http://127.0.0.1:8000/execute/draft}")
    private String executeDraftUrl;

    @Value("${fastapi.reflect-review-url:http://127.0.0.1:8000/reflect/review}")
    private String reflectReviewUrl;

    @Value("${fastapi.execute-revise-url:http://127.0.0.1:8000/execute/revise}")
    private String executeReviseUrl;

    @Value("${workflow.reflector.max-retries:3}")
    private int maxRetries;

    public AgentOrchestratorService(ProposalRepository proposalRepository,
            RateCardRepository rateCardRepository,
            JobRepository jobRepository,
            WorkflowWebSocketHandler webSocketHandler,
            RestTemplate restTemplate,
            ObjectMapper objectMapper) {
        this.proposalRepository = proposalRepository;
        this.rateCardRepository = rateCardRepository;
        this.jobRepository = jobRepository;
        this.webSocketHandler = webSocketHandler;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    @Async
    public void startWorkflow(UUID proposalId) {
        try {
            Proposal proposal = proposalRepository.findById(proposalId)
                    .orElseThrow(() -> new IllegalArgumentException("Proposal not found: " + proposalId));

            // Track Job initiation
            Job job = new Job();
            job.setProposalId(proposalId);
            job.setStatus("STARTED");
            job.setStartedAt(LocalDateTime.now());
            jobRepository.save(job);

            proposal.setStatus("PROCESSING");
            proposal.setUpdatedAt(LocalDateTime.now());
            proposalRepository.save(proposal);
            notifyStatus(proposalId, "planner_phase1_running", null);

            // Phase 1: Planning Ambiguities
            Map<String, Object> planRequest = new HashMap<>();
            planRequest.put("text", proposal.getCustomerRequirement());

            Map<String, Object> planResponse = restTemplate.postForObject(planUrl, planRequest, Map.class);
            List<String> ambiguities = planResponse != null ? (List<String>) planResponse.get("ambiguities") : null;

            if (ambiguities != null && !ambiguities.isEmpty()) {
                proposal.setStatus("PENDING_CLARIFICATION");
                proposal.setPlanTasks(objectMapper.writeValueAsString(ambiguities));
                proposal.setUpdatedAt(LocalDateTime.now());
                proposalRepository.save(proposal);

                Map<String, Object> payload = new HashMap<>();
                payload.put("ambiguities", ambiguities);
                notifyStatus(proposalId, "ambiguities_received", payload);
                return;
            }

            // If no ambiguities, finalize plan automatically
            List<String> tasks = planResponse != null ? (List<String>) planResponse.get("tasks") : Collections.emptyList();
            proposal.setPlanTasks(objectMapper.writeValueAsString(tasks));
            proposal.setUpdatedAt(LocalDateTime.now());
            proposalRepository.save(proposal);

            continueAfterPlanFinalized(proposal, tasks);

        } catch (Exception e) {
            logger.error("Workflow failed at startWorkflow for proposal {}: {}", proposalId, e.getMessage(), e);
            handleWorkflowFailure(proposalId, e);
        }
    }

    public void submitClarifications(UUID proposalId, ClarificationRequestDto requestDto) {
        submitClarifications(proposalId, requestDto.getAnswers(), requestDto.getAmbiguities());
    }

    @Async
    public void submitClarifications(UUID proposalId, List<String> answers, List<String> ambiguities) {
        try {
            Proposal proposal = proposalRepository.findById(proposalId)
                    .orElseThrow(() -> new IllegalArgumentException("Proposal not found: " + proposalId));

            proposal.setStatus("PROCESSING");
            proposal.setUpdatedAt(LocalDateTime.now());
            proposalRepository.save(proposal);
            notifyStatus(proposalId, "planner_phase2_running", null);

            Map<String, Object> planRequest = new HashMap<>();
            planRequest.put("text", proposal.getCustomerRequirement());
            planRequest.put("answers", answers);
            planRequest.put("ambiguities_snapshot", ambiguities);

            Map<String, Object> planResponse = restTemplate.postForObject(planUrl, planRequest, Map.class);
            List<String> tasks = planResponse != null ? (List<String>) planResponse.get("tasks") : Collections.emptyList();

            proposal.setPlanTasks(objectMapper.writeValueAsString(tasks));
            proposal.setUpdatedAt(LocalDateTime.now());
            proposalRepository.save(proposal);

            continueAfterPlanFinalized(proposal, tasks);

        } catch (Exception e) {
            logger.error("Workflow failed at submitClarifications for proposal {}: {}", proposalId, e.getMessage(), e);
            handleWorkflowFailure(proposalId, e);
        }
    }

    private void continueAfterPlanFinalized(Proposal proposal, List<String> tasks) throws Exception {
        // Step 2: Research
        notifyStatus(proposal.getId(), "researcher_running", null);
        Map<String, Object> researchRequest = new HashMap<>();
        researchRequest.put("tasks", tasks);

        Map<String, Object> context = new HashMap<>();
        context.put("project_title", proposal.getTitle());
        researchRequest.put("context", context);

        Map<String, Object> researchResponse = restTemplate.postForObject(researchUrl, researchRequest, Map.class);
        Object findings = researchResponse != null ? researchResponse.get("findings") : Collections.emptyList();
        proposal.setResearchFindings(objectMapper.writeValueAsString(findings));
        proposal.setUpdatedAt(LocalDateTime.now());
        proposalRepository.save(proposal);

        // Step 3: Executor Pricing Calculation with RateCard and Historical Job Data
        notifyStatus(proposal.getId(), "pricing_calculating", null);
        List<RateCard> rawRateCards = rateCardRepository.findAll();
        List<Map<String, Object>> rateCardsList = new ArrayList<>();
        if (rawRateCards != null) {
            for (RateCard rc : rawRateCards) {
                Map<String, Object> item = new HashMap<>();
                item.put("item_name", rc.getItemName() != null ? rc.getItemName() : "Standard Rate");
                item.put("category", rc.getCategory() != null ? rc.getCategory() : "Engineering");
                item.put("unit", rc.getUnit() != null ? rc.getUnit() : "Hour");
                item.put("price", rc.getPrice() != null ? rc.getPrice().doubleValue() : 100.0);
                item.put("currency", rc.getCurrency() != null ? rc.getCurrency() : "USD");
                rateCardsList.add(item);
            }
        }
        List<Map<String, Object>> historicalProjects = fetchHistoricalProjects();

        Map<String, Object> pricingRequest = new HashMap<>();
        pricingRequest.put("tasks", tasks);
        pricingRequest.put("findings", findings);
        pricingRequest.put("rate_card", rateCardsList);
        pricingRequest.put("historical_data", historicalProjects != null ? historicalProjects : Collections.emptyList());

        Map<String, Object> pricingResponse = restTemplate.postForObject(executePricingUrl, pricingRequest, Map.class);
        Object tiers = pricingResponse != null ? pricingResponse.get("tiers") : Collections.emptyMap();
        proposal.setPricingTiers(objectMapper.writeValueAsString(tiers));
        proposal.setStatus("PENDING_PRICING");
        proposal.setUpdatedAt(LocalDateTime.now());
        proposalRepository.save(proposal);

        Map<String, Object> payload = new HashMap<>();
        payload.put("tiers", tiers);
        payload.put("tasks", tasks);
        payload.put("findings", findings);
        notifyStatus(proposal.getId(), "pending_pricing", payload);
    }

    public void finalizePricing(UUID proposalId, PricingSelectionDto selectionDto) {
        Map<String, Object> pricingMap = new HashMap<>();
        pricingMap.put("tier_name", selectionDto.getTierName());
        pricingMap.put("total_hours", selectionDto.getTotalHours());
        pricingMap.put("total_cost", selectionDto.getTotalCost());
        pricingMap.put("role_breakdown", selectionDto.getRoleBreakdown());
        pricingMap.put("rationale", selectionDto.getRationale());
        finalizePricing(proposalId, pricingMap);
    }

    @Async
    public void finalizePricing(UUID proposalId, Map<String, Object> selectedPricing) {
        try {
            Proposal proposal = proposalRepository.findById(proposalId)
                    .orElseThrow(() -> new IllegalArgumentException("Proposal not found: " + proposalId));

            proposal.setStatus("GENERATING_DRAFT");
            proposal.setSelectedPricing(objectMapper.writeValueAsString(selectedPricing));
            proposal.setUpdatedAt(LocalDateTime.now());
            proposalRepository.save(proposal);
            notifyStatus(proposalId, "drafting_proposal", null);

            List<String> tasks = proposal.getPlanTasks() != null
                    ? objectMapper.readValue(proposal.getPlanTasks(), List.class)
                    : Collections.emptyList();
            List<?> findings = proposal.getResearchFindings() != null
                    ? objectMapper.readValue(proposal.getResearchFindings(), List.class)
                    : Collections.emptyList();

            // Generate first draft
            Map<String, Object> draftRequest = new HashMap<>();
            draftRequest.put("tasks", tasks);
            draftRequest.put("findings", findings);
            draftRequest.put("selected_pricing", selectedPricing);

            Map<String, Object> draftResponse = restTemplate.postForObject(executeDraftUrl, draftRequest, Map.class);
            String draft = draftResponse != null ? (String) draftResponse.get("draft") : "";

            int retryAttempt = 0;
            boolean passedReflection = false;
            int overallScore = 0;
            List<?> reflectorWarnings = new ArrayList<>();

            while (retryAttempt < maxRetries) {
                // Call Reflector review
                Map<String, Object> reviewRequest = new HashMap<>();
                reviewRequest.put("tasks", tasks);
                reviewRequest.put("findings", findings);
                reviewRequest.put("selected_pricing", selectedPricing);
                reviewRequest.put("draft", draft);
                reviewRequest.put("retry_attempt", retryAttempt);

                Map<String, Object> reviewResponse = restTemplate.postForObject(reflectReviewUrl, reviewRequest, Map.class);
                String verdict = reviewResponse != null ? (String) reviewResponse.get("verdict") : "FAIL";
                overallScore = (reviewResponse != null && reviewResponse.get("overall_score") != null)
                        ? ((Number) reviewResponse.get("overall_score")).intValue()
                        : 0;
                reflectorWarnings = reviewResponse != null ? (List<?>) reviewResponse.get("issues") : Collections.emptyList();

                if ("PASS".equalsIgnoreCase(verdict)) {
                    passedReflection = true;
                    break;
                }

                // If FAIL and retry attempt is within budget, revise the draft
                if (retryAttempt < maxRetries - 1) {
                    notifyStatus(proposalId, "revising_draft", Map.of("retryAttempt", retryAttempt + 1));

                    Map<String, Object> reviseRequest = new HashMap<>();
                    reviseRequest.put("tasks", tasks);
                    reviseRequest.put("findings", findings);
                    reviseRequest.put("selected_pricing", selectedPricing);
                    reviseRequest.put("previous_draft", draft);
                    reviseRequest.put("revision_instructions", reviewResponse != null ? reviewResponse.get("revision_instructions") : "");
                    reviseRequest.put("retry_attempt", retryAttempt + 1);

                    Map<String, Object> reviseResponse = restTemplate.postForObject(executeReviseUrl, reviseRequest, Map.class);
                    if (reviseResponse != null && reviseResponse.get("draft") != null) {
                        draft = (String) reviseResponse.get("draft");
                    }
                }

                retryAttempt++;
            }

            proposal.setDraftProposal(draft);
            proposal.setStatus("PENDING_DRAFT_APPROVAL");
            proposal.setUpdatedAt(LocalDateTime.now());
            proposalRepository.save(proposal);

            // Construct enriched WebSocket payload
            Map<String, Object> payload = new HashMap<>();
            payload.put("draft", draft);
            payload.put("passed_reflection", passedReflection);
            payload.put("overall_score", overallScore);
            payload.put("reflector_warnings", reflectorWarnings);
            payload.put("retry_count", retryAttempt);
            notifyStatus(proposalId, "pending_draft_approval", payload);

        } catch (Exception e) {
            logger.error("Workflow failed at finalizePricing for proposal {}: {}", proposalId, e.getMessage(), e);
            handleWorkflowFailure(proposalId, e);
        }
    }

    public void approveProposal(UUID proposalId, ProposalApprovalDto approvalDto) {
        approveProposal(proposalId, approvalDto.getFinalProposal(), approvalDto.getActualHoursSpent());
    }

    public void approveProposal(UUID proposalId, String finalDraft) {
        approveProposal(proposalId, finalDraft, null);
    }

    public void approveProposal(UUID proposalId, String finalDraft, Double actualHoursSpent) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new IllegalArgumentException("Proposal not found: " + proposalId));

        proposal.setFinalProposal(finalDraft);
        proposal.setStatus("COMPLETED");
        proposal.setUpdatedAt(LocalDateTime.now());
        proposalRepository.save(proposal);

        List<Job> existingJobs = jobRepository.findAll().stream()
                .filter(j -> proposalId.equals(j.getProposalId()))
                .toList();

        Job job = existingJobs.isEmpty() ? new Job() : existingJobs.get(existingJobs.size() - 1);
        job.setProposalId(proposalId);
        job.setStatus("COMPLETED");
        job.setCompletedAt(LocalDateTime.now());
        if (actualHoursSpent != null) {
            job.setActualHoursSpent(actualHoursSpent);
        }
        if (job.getStartedAt() == null) {
            job.setStartedAt(proposal.getCreatedAt() != null ? proposal.getCreatedAt() : LocalDateTime.now());
        }
        jobRepository.save(job);

        notifyStatus(proposalId, "completed", null);
    }

    private List<Map<String, Object>> fetchHistoricalProjects() {
        try {
            List<Job> completedJobs = jobRepository.findAll().stream()
                    .filter(job -> "COMPLETED".equalsIgnoreCase(job.getStatus()))
                    .toList();

            List<Map<String, Object>> historicalProjects = new ArrayList<>();
            
            for (Job job : completedJobs) {
                if (job.getProposalId() == null) continue;
                proposalRepository.findById(job.getProposalId()).ifPresent(histProposal -> {
                    try {
                        List<String> tasks = histProposal.getPlanTasks() != null
                                ? objectMapper.readValue(histProposal.getPlanTasks(), List.class)
                                : Collections.emptyList();

                        double hoursSpent = 40.0;
                        if (job.getActualHoursSpent() != null && job.getActualHoursSpent() > 0) {
                            hoursSpent = job.getActualHoursSpent();
                        } else if (job.getStartedAt() != null && job.getCompletedAt() != null) {
                            long minutes = Duration.between(job.getStartedAt(), job.getCompletedAt()).toMinutes();
                            hoursSpent = Math.max(1.0, minutes / 60.0);
                        }

                        Map<String, Object> projectData = new HashMap<>();
                        projectData.put("title", histProposal.getTitle() != null ? histProposal.getTitle() : "Historical Project");
                        projectData.put("tasks", tasks);
                        projectData.put("hours_spent", hoursSpent);
                        historicalProjects.add(projectData);
                    } catch (Exception e) {
                        logger.warn("Could not parse historical proposal tasks for job {}: {}", job.getId(), e.getMessage());
                    }
                });
            }
            return historicalProjects;
        } catch (Exception e) {
            logger.warn("Error fetching historical projects: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private void handleWorkflowFailure(UUID proposalId, Exception e) {
        try {
            Proposal proposal = proposalRepository.findById(proposalId).orElse(null);
            if (proposal != null) {
                proposal.setStatus("FAILED");
                proposal.setUpdatedAt(LocalDateTime.now());
                proposalRepository.save(proposal);
            }
            Map<String, Object> payload = new HashMap<>();
            payload.put("error", e.getMessage());
            notifyStatus(proposalId, "error", payload);
        } catch (Exception ex) {
            logger.error("Failed to record workflow failure for proposal {}: {}", proposalId, ex.getMessage());
        }
    }

    private void notifyStatus(UUID proposalId, String status, Map<String, Object> payload) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("proposalId", proposalId);
            message.put("status", status);
            message.put("payload", payload);
            String jsonMessage = objectMapper.writeValueAsString(message);
            webSocketHandler.sendToProposal(proposalId, jsonMessage);
        } catch (Exception e) {
            logger.error("Failed to notify WebSocket status for proposal {}: {}", proposalId, e.getMessage());
        }
    }
}
