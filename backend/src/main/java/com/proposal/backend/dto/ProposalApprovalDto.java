package com.proposal.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProposalApprovalDto {
    @NotBlank(message = "Final proposal content is required")
    private String finalProposal;

    private Double actualHoursSpent;
}
