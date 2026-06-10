package com.treinus.workouts.dto;

import com.treinus.workouts.Workout;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record WorkoutResponse(
        UUID id,
        String name,
        String description,
        UUID userId,
        List<WorkoutExerciseResponse> exercises,
        Instant createdAt,
        Instant updatedAt
) {
    public static WorkoutResponse from(Workout workout) {
        List<WorkoutExerciseResponse> exercises = workout.getExercises().stream()
                .map(WorkoutExerciseResponse::from)
                .toList();

        return new WorkoutResponse(
                workout.getId(),
                workout.getName(),
                workout.getDescription(),
                workout.getUser().getId(),
                exercises,
                workout.getCreatedAt(),
                workout.getUpdatedAt()
        );
    }
}
