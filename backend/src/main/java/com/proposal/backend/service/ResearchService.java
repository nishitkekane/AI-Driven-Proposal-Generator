package com.proposal.backend.service;

import com.proposal.backend.dto.ResearchRequestDto;
import com.proposal.backend.dto.ResearchResponseDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class ResearchService {

    private final RestTemplate restTemplate;

    @Value("${fastapi.research-url:http://127.0.0.1:8000/research}")
    private String fastApiResearchUrl;

    public ResearchService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Forwards the task list and optional context to the FastAPI Researcher Agent.
     */
    public ResearchResponseDto performResearch(ResearchRequestDto requestDto) {
        return restTemplate.postForObject(fastApiResearchUrl, requestDto, ResearchResponseDto.class);
    }
}
