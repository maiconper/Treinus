package com.treinus.workouts;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface WorkoutExerciseRepository extends JpaRepository<WorkoutExercise, UUID> {

    Optional<WorkoutExercise> findByIdAndWorkoutId(UUID id, UUID workoutId);

    @Query("SELECT COALESCE(MAX(we.orderIndex), -1) FROM WorkoutExercise we WHERE we.workout.id = :workoutId")
    int findMaxOrderIndex(@Param("workoutId") UUID workoutId);
}
