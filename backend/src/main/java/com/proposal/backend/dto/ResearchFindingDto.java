package com.proposal.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ResearchFindingDto {

    @JsonProperty("task_reference")
    private String taskReference;

    private String insight;

    private String confidence;
}
