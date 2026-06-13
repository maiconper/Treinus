package com.treinus.workouts.dto;

import com.treinus.users.UserRole;
import com.treinus.workouts.Workout;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record WorkoutResponse(
        UUID id,
        String name,
        String description,
        UUID userId,
        boolean preset,
        List<WorkoutExerciseResponse> exercises,
        Instant createdAt,
        Instant updatedAt
) {
    public static WorkoutResponse from(Workout workout) {
        return new WorkoutResponse(
                workout.getId(),
                workout.getName(),
                workout.getDescription(),
                workout.getUser().getId(),
                workout.getUser().getRole() == UserRole.SYSTEM,
                workout.getExercises().stream().map(WorkoutExerciseResponse::from).toList(),
                workout.getCreatedAt(),
                workout.getUpdatedAt()
        );
    }
}
