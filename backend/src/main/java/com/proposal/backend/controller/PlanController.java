package com.proposal.backend.controller;

import com.proposal.backend.dto.PlanRequestDto;
import com.proposal.backend.dto.PlanResponseDto;
import com.proposal.backend.service.PlanService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/plans")
public class PlanController {
    
    private final PlanService planService;

    public PlanController(PlanService planService) {
        this.planService = planService;
    }

    @PostMapping("/generate")
    public ResponseEntity<PlanResponseDto> generatePlan(@Valid @RequestBody PlanRequestDto requestDto) {
        PlanResponseDto response = planService.generatePlan(requestDto);
        return ResponseEntity.ok(response);
    }
}
