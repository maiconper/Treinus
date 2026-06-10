package com.treinus.programs;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProgramRepository extends JpaRepository<Program, UUID> {

    List<Program> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<Program> findByIdAndUserId(UUID id, UUID userId);

    Optional<Program> findByUserIdAndStatus(UUID userId, ProgramStatus status);
}
