package com.proposal.backend.controller;

import com.proposal.backend.dto.ResearchRequestDto;
import com.proposal.backend.dto.ResearchResponseDto;
import com.proposal.backend.service.ResearchService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/research")
public class ResearchController {

    private final ResearchService researchService;

    public ResearchController(ResearchService researchService) {
        this.researchService = researchService;
    }

    @PostMapping
    public ResponseEntity<ResearchResponseDto> performResearch(
            @Valid @RequestBody ResearchRequestDto requestDto) {
        ResearchResponseDto response = researchService.performResearch(requestDto);
        return ResponseEntity.ok(response);
    }
}
