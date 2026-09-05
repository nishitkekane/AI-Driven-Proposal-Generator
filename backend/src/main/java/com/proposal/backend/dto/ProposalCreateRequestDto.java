package com.proposal.backend.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;

public class ProposalCreateRequestDto {

    @NotBlank(message = "Title is required")
    private String title = "";

    @NotBlank(message = "Customer Requirement is required")
    private String customerRequirement = "";

    private UUID userId;

    public ProposalCreateRequestDto() {}

    public ProposalCreateRequestDto(String title, String customerRequirement, UUID userId) {
        this.title = title;
        this.customerRequirement = customerRequirement;
        this.userId = userId;
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

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }
}
