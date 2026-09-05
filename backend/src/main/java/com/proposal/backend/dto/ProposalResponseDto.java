package com.proposal.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class ProposalResponseDto {

    private UUID id;
    private String title;
    private String customerRequirement;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID userId;
    private String planTasks;
    private String researchFindings;
    private String pricingTiers;
    private String selectedPricing;
    private String draftProposal;
    private String finalProposal;

    public ProposalResponseDto() {
    }

    public ProposalResponseDto(UUID id, String title, String customerRequirement, String status,
            LocalDateTime createdAt, LocalDateTime updatedAt, UUID userId,
            String planTasks, String researchFindings, String pricingTiers,
            String selectedPricing, String draftProposal, String finalProposal) {
        this.id = id;
        this.title = title;
        this.customerRequirement = customerRequirement;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.userId = userId;
        this.planTasks = planTasks;
        this.researchFindings = researchFindings;
        this.pricingTiers = pricingTiers;
        this.selectedPricing = selectedPricing;
        this.draftProposal = draftProposal;
        this.finalProposal = finalProposal;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCustomerRequirement() {
        return customerRequirement;
    }

    public void setCustomerRequirement(String customerRequirement) {
        this.customerRequirement = customerRequirement;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getPlanTasks() {
        return planTasks;
    }

    public void setPlanTasks(String planTasks) {
        this.planTasks = planTasks;
    }

    public String getResearchFindings() {
        return researchFindings;
    }

    public void setResearchFindings(String researchFindings) {
        this.researchFindings = researchFindings;
    }

    public String getPricingTiers() {
        return pricingTiers;
    }

    public void setPricingTiers(String pricingTiers) {
        this.pricingTiers = pricingTiers;
    }

    public String getSelectedPricing() {
        return selectedPricing;
    }

    public void setSelectedPricing(String selectedPricing) {
        this.selectedPricing = selectedPricing;
    }

    public String getDraftProposal() {
        return draftProposal;
    }

    public void setDraftProposal(String draftProposal) {
        this.draftProposal = draftProposal;
    }

    public String getFinalProposal() {
        return finalProposal;
    }

    public void setFinalProposal(String finalProposal) {
        this.finalProposal = finalProposal;
    }
}
