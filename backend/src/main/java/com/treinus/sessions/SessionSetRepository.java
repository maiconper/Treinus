package com.treinus.sessions;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface SessionSetRepository extends JpaRepository<SessionSet, UUID> {

    @Query("""
            SELECT ss FROM SessionSet ss
            JOIN FETCH ss.sessionExercise se
            JOIN FETCH se.exercise e
            JOIN se.session s
            WHERE s.user.id = :userId
              AND s.status = 'COMPLETED'
              AND ss.personalRecord = true
            ORDER BY ss.completedAt DESC
            """)
    List<SessionSet> findPersonalRecordsByUserId(@Param("userId") UUID userId);
}
