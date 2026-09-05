package com.proposal.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.proposal.backend.dto.ProposalCreateRequestDto;
import com.proposal.backend.dto.ProposalResponseDto;
import com.proposal.backend.service.ProposalService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/proposals")
public class ProposalController {

    private final ProposalService proposalService;

    public ProposalController(ProposalService proposalService) {
        this.proposalService = proposalService;
    }

    @PostMapping
    public ResponseEntity<ProposalResponseDto> createProposal(@Valid @RequestBody ProposalCreateRequestDto requestDto) {
        ProposalResponseDto created = proposalService.createProposal(requestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProposalResponseDto> getProposalById(@PathVariable UUID id) {
        ProposalResponseDto proposal = proposalService.getProposalById(id);
        return ResponseEntity.ok(proposal);
    }

    @GetMapping
    public ResponseEntity<List<ProposalResponseDto>> getAllProposals() {
        List<ProposalResponseDto> proposals = proposalService.getAllProposals();
        return ResponseEntity.ok(proposals);
    }
}
