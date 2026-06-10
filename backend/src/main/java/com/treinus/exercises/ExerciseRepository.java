package com.treinus.exercises;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface ExerciseRepository extends JpaRepository<Exercise, UUID> {

    @Query("""
            SELECT e FROM Exercise e
            WHERE (e.global = true OR e.createdBy.id = :userId)
            AND (:category IS NULL OR e.category = :category)
            AND (:equipment IS NULL OR e.equipment = :equipment)
            """)
    Page<Exercise> findAccessibleByUser(
            @Param("userId") UUID userId,
            @Param("category") ExerciseCategory category,
            @Param("equipment") Equipment equipment,
            Pageable pageable);

    Page<Exercise> findByGlobalTrue(Pageable pageable);
}
