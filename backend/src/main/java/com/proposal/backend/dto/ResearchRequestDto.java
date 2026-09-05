package com.proposal.backend.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

@Data
public class ResearchRequestDto {

    @NotNull
    @Size(min = 1, message = "At least one task is required")
    private List<String> tasks;

    private ResearchContextDto context = new ResearchContextDto();
}
