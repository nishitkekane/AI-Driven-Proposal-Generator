package com.proposal.backend.service;

import com.proposal.backend.dto.PlanRequestDto;
import com.proposal.backend.dto.PlanResponseDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class PlanService {

    private final RestTemplate restTemplate;

    @Value("${fastapi.plan-url:http://127.0.0.1:8000/plan}")
    private String fastApiPlanUrl;

    public PlanService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Forwards the full PlanRequestDto to FastAPI.
     * Phase is auto-detected by FastAPI: absence of `answers` → Phase 1, presence → Phase 2.
     */
    public PlanResponseDto generatePlan(PlanRequestDto requestDto) {
        return restTemplate.postForObject(fastApiPlanUrl, requestDto, PlanResponseDto.class);
    }
}
