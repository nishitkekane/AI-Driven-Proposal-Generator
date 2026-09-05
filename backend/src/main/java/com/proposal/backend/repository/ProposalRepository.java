package com.proposal.backend.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.proposal.backend.entity.Proposal;

public interface ProposalRepository extends JpaRepository<Proposal, UUID> {
}