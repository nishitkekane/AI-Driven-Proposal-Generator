package com.proposal.backend.controller;

import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.proposal.backend.dto.ClarificationRequestDto;
import com.proposal.backend.dto.PricingSelectionDto;
import com.proposal.backend.dto.ProposalApprovalDto;
import com.proposal.backend.service.AgentOrchestratorService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/workflow")
public class WorkflowController {

    private final AgentOrchestratorService orchestratorService;

    public WorkflowController(AgentOrchestratorService orchestratorService) {
        this.orchestratorService = orchestratorService;
    }

    @PostMapping("/start/{proposalId}")
    public ResponseEntity<Map<String, String>> startWorkflow(@PathVariable UUID proposalId) {
        orchestratorService.startWorkflow(proposalId);
        return ResponseEntity.ok(Map.of("message", "Workflow started successfully", "proposalId", proposalId.toString()));
    }

    @PostMapping("/clarify/{proposalId}")
    public ResponseEntity<Map<String, String>> submitClarifications(
            @PathVariable UUID proposalId,
            @Valid @RequestBody ClarificationRequestDto requestDto) {
        orchestratorService.submitClarifications(proposalId, requestDto);
        return ResponseEntity.ok(Map.of("message", "Clarifications submitted", "proposalId", proposalId.toString()));
    }

    @PostMapping("/pricing/{proposalId}")
    public ResponseEntity<Map<String, String>> finalizePricing(
            @PathVariable UUID proposalId,
            @Valid @RequestBody PricingSelectionDto pricingDto) {
        orchestratorService.finalizePricing(proposalId, pricingDto);
        return ResponseEntity.ok(Map.of("message", "Pricing finalized", "proposalId", proposalId.toString()));
    }

    @PostMapping("/approve/{proposalId}")
    public ResponseEntity<Map<String, String>> approveProposal(
            @PathVariable UUID proposalId,
            @Valid @RequestBody ProposalApprovalDto approvalDto) {
        orchestratorService.approveProposal(proposalId, approvalDto);
        return ResponseEntity.ok(Map.of("message", "Proposal approved and saved", "proposalId", proposalId.toString()));
    }
}