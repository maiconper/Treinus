package com.treinus.workouts;

import com.treinus.users.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkoutRepository extends JpaRepository<Workout, UUID> {

    List<Workout> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<Workout> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT w FROM Workout w WHERE w.user.role = :role ORDER BY w.createdAt ASC")
    List<Workout> findAllByUserRole(@Param("role") UserRole role);

    @Query("SELECT w FROM Workout w WHERE w.id = :id AND w.user.role = :role")
    Optional<Workout> findByIdAndUserRole(@Param("id") UUID id, @Param("role") UserRole role);
}
