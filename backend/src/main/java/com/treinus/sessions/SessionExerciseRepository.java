package com.treinus.sessions;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

public interface SessionExerciseRepository extends JpaRepository<SessionExercise, UUID> {

    Optional<SessionExercise> findByIdAndSessionId(UUID id, UUID sessionId);

    @Query("""
            SELECT MAX(ss.weightKg)
            FROM SessionSet ss
            JOIN ss.sessionExercise se
            JOIN se.session s
            WHERE se.exercise.id = :exerciseId
            AND s.user.id = :userId
            AND s.status = 'COMPLETED'
            """)
    Optional<BigDecimal> findPersonalRecord(@Param("exerciseId") UUID exerciseId,
                                            @Param("userId") UUID userId);
}
