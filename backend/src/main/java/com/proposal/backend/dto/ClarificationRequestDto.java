package com.proposal.backend.dto;

import java.util.List;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClarificationRequestDto {
    @NotNull(message = "Answers list cannot be null")
    private List<String> answers;

    private List<String> ambiguities;
}
