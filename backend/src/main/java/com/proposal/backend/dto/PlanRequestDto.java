package com.proposal.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotNull;

import java.util.List;

@Data
public class PlanRequestDto {

    @NotNull(message = "Text cannot be null")
    @Size(min = 10, max = 50000, message = "Text must be between 10 and 50000 characters")
    private String text;

    /**
     * Present only in Phase 2. Absence signals Phase 1 (ambiguity detection).
     */
    private List<String> answers;

    /**
     * The exact ambiguity questions returned in Phase 1, echoed back so the
     * backend can pair them with answers without server-side session state.
     * Snake_case key expected by FastAPI.
     */
    @JsonProperty("ambiguities_snapshot")
    private List<String> ambiguitiesSnapshot;
}
