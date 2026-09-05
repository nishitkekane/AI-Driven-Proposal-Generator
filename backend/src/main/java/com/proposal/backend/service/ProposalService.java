package com.proposal.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.proposal.backend.dto.ProposalCreateRequestDto;
import com.proposal.backend.dto.ProposalResponseDto;
import com.proposal.backend.entity.Proposal;
import com.proposal.backend.entity.User;
import com.proposal.backend.repository.ProposalRepository;
import com.proposal.backend.repository.UserRepository;

@Service
public class ProposalService {

    private static final Logger logger = LoggerFactory.getLogger(ProposalService.class);

    private final ProposalRepository proposalRepository;
    private final UserRepository userRepository;

    public ProposalService(ProposalRepository proposalRepository, UserRepository userRepository) {
        this.proposalRepository = proposalRepository;
        this.userRepository = userRepository;
    }

    public ProposalResponseDto createProposal(ProposalCreateRequestDto requestDto) {
        Proposal proposal = new Proposal();

        proposal.setTitle(requestDto.getTitle());
        proposal.setCustomerRequirement(requestDto.getCustomerRequirement());
        proposal.setStatus("PENDING");
        proposal.setCreatedAt(LocalDateTime.now());
        proposal.setUpdatedAt(LocalDateTime.now());

        UUID userId = requestDto.getUserId();
        if (userId == null) {
            userId = resolveCurrentUserId();
        }
        proposal.setUserId(userId);

        Proposal savedProposal = proposalRepository.save(proposal);

        return mapToDto(savedProposal);
    }

    private UUID resolveCurrentUserId() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && auth.getName() != null && !"anonymousUser".equals(auth.getName())) {
                User user = userRepository.findByEmail(auth.getName()).orElse(null);
                if (user != null) {
                    return user.getId();
                }
            }
        } catch (Exception e) {
            logger.warn("Could not resolve authenticated user from SecurityContext: {}", e.getMessage());
        }

        // Fallback to first existing user in DB
        return userRepository.findAll().stream()
                .findFirst()
                .map(User::getId)
                .orElse(null);
    }

    public ProposalResponseDto getProposalById(UUID id) {
        Proposal proposal = proposalRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Proposal not found with id: " + id
                        ));

        return mapToDto(proposal);
    }

    public List<ProposalResponseDto> getAllProposals() {
        return proposalRepository.findAll()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public ProposalResponseDto mapToDto(Proposal proposal) {
        return new ProposalResponseDto(
                proposal.getId(),
                proposal.getTitle(),
                proposal.getCustomerRequirement(),
                proposal.getStatus(),
                proposal.getCreatedAt(),
                proposal.getUpdatedAt(),
                proposal.getUserId(),
                proposal.getPlanTasks(),
                proposal.getResearchFindings(),
                proposal.getPricingTiers(),
                proposal.getSelectedPricing(),
                proposal.getDraftProposal(),
                proposal.getFinalProposal()
        );
    }
}
