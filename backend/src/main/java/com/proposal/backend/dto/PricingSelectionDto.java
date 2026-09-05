package com.proposal.backend.dto;

import java.util.List;
import java.util.Map;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PricingSelectionDto {
    @NotBlank(message = "Tier name is required")
    private String tierName;

    @NotNull(message = "Total hours is required")
    private Double totalHours;

    @NotNull(message = "Total cost is required")
    private Double totalCost;

    private List<Map<String, Object>> roleBreakdown;
    private String rationale;
}
