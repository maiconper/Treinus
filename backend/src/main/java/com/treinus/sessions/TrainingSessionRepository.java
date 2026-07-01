package com.treinus.sessions;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TrainingSessionRepository extends JpaRepository<TrainingSession, UUID> {

    Optional<TrainingSession> findByUserIdAndStatus(UUID userId, SessionStatus status);

    Optional<TrainingSession> findByIdAndUserId(UUID id, UUID userId);

    Page<TrainingSession> findByUserIdAndStatusOrderByStartedAtDesc(UUID userId, SessionStatus status,
                                                                     Pageable pageable);

    List<TrainingSession> findByProgramDayIdInAndStatusOrderByFinishedAtDesc(
            Collection<UUID> programDayIds, SessionStatus status);

    List<TrainingSession> findByUserIdAndStatusAndFinishedAtBetween(
            UUID userId, SessionStatus status, java.time.Instant from, java.time.Instant to);

    List<TrainingSession> findByUserIdAndStatusOrderByFinishedAtAsc(UUID userId, SessionStatus status);

    @Query("""
            SELECT COUNT(ss) FROM SessionSet ss
            JOIN ss.sessionExercise se
            JOIN se.session s
            WHERE s.user.id = :userId AND s.status = 'COMPLETED'
            """)
    long countTotalSetsByUserId(@Param("userId") UUID userId);
}
