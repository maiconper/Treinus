package com.treinus.sessions;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TrainingSessionRepository extends JpaRepository<TrainingSession, UUID> {

    Optional<TrainingSession> findByUserIdAndStatus(UUID userId, SessionStatus status);

    Optional<TrainingSession> findByIdAndUserId(UUID id, UUID userId);

    Page<TrainingSession> findByUserIdAndStatusOrderByStartedAtDesc(UUID userId, SessionStatus status,
                                                                     Pageable pageable);
}
