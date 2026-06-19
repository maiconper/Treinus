package com.treinus.exercises.dto;

import com.treinus.exercises.Equipment;
import com.treinus.exercises.Exercise;
import com.treinus.exercises.ExerciseCategory;

import java.time.Instant;
import java.util.UUID;

public record ExerciseResponse(
        UUID id,
        String name,
        String description,
        String gifUrl,
        ExerciseCategory category,
        String primaryMuscleGroup,
        Equipment equipment,
        boolean global,
        UUID createdBy,
        Instant createdAt
) {
    public static ExerciseResponse from(Exercise exercise) {
        String gifUrl = exercise.getExercisedbId() != null
                ? "/api/v1/exercises/" + exercise.getId() + "/gif"
                : exercise.getGifUrl();
        return new ExerciseResponse(
                exercise.getId(),
                exercise.getName(),
                exercise.getDescription(),
                gifUrl,
                exercise.getCategory(),
                exercise.getPrimaryMuscleGroup(),
                exercise.getEquipment(),
                exercise.isGlobal(),
                exercise.getCreatedBy() != null ? exercise.getCreatedBy().getId() : null,
                exercise.getCreatedAt()
        );
    }
}
