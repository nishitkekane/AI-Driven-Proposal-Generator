package com.proposal.backend.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.proposal.backend.entity.Job;

public interface JobRepository extends JpaRepository<Job, UUID> {
}