package com.proposal.backend.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "proposals")
public class Proposal {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(name = "customer_requirements", nullable = false, columnDefinition = "TEXT")
    private String customerRequirement;

    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, PROCESSING, PENDING_CLARIFICATION, PENDING_PRICING, PENDING_DRAFT_APPROVAL, COMPLETED, FAILED

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "plan_tasks", columnDefinition = "TEXT")
    private String planTasks;

    @Column(name = "research_findings", columnDefinition = "TEXT")
    private String researchFindings;

    @Column(name = "pricing_tiers", columnDefinition = "TEXT")
    private String pricingTiers;

    @Column(name = "selected_pricing", columnDefinition = "TEXT")
    private String selectedPricing;

    @Column(name = "draft_proposal", columnDefinition = "TEXT")
    private String draftProposal;

    @Column(name = "final_proposal", columnDefinition = "TEXT")
    private String finalProposal;

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCustomerRequirement() { return customerRequirement; }
    public void setCustomerRequirement(String customerRequirement) { this.customerRequirement = customerRequirement; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getPlanTasks() { return planTasks; }
    public void setPlanTasks(String planTasks) { this.planTasks = planTasks; }
    public String getResearchFindings() { return researchFindings; }
    public void setResearchFindings(String researchFindings) { this.researchFindings = researchFindings; }
    public String getPricingTiers() { return pricingTiers; }
    public void setPricingTiers(String pricingTiers) { this.pricingTiers = pricingTiers; }
    public String getSelectedPricing() { return selectedPricing; }
    public void setSelectedPricing(String selectedPricing) { this.selectedPricing = selectedPricing; }
    public String getDraftProposal() { return draftProposal; }
    public void setDraftProposal(String draftProposal) { this.draftProposal = draftProposal; }
    public String getFinalProposal() { return finalProposal; }
    public void setFinalProposal(String finalProposal) { this.finalProposal = finalProposal; }
}