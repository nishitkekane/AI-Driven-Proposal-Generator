package com.proposal.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ResearchContextDto {

    @JsonProperty("project_title")
    private String projectTitle = "";

    @JsonProperty("client_name")
    private String clientName = "";

    private String industry = "";

    @JsonProperty("budget_range")
    private String budgetRange = "";

    private String deadline = "";
}
