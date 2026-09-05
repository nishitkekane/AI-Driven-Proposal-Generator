package com.proposal.backend.dto;

import lombok.Data;
import java.util.List;
import java.util.ArrayList;

@Data
public class PlanResponseDto {

    /**
     * "AMBIGUITIES" → Phase 1 complete; ambiguities populated, tasks empty.
     * "FINALIZED"   → Phase 2 complete; tasks populated, ambiguities empty.
     */
    private String stage;

    private List<String> ambiguities = new ArrayList<>();

    private List<String> tasks = new ArrayList<>();
}
