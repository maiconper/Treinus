package com.treinus.workouts.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record AddExerciseToWorkoutRequest(
        @NotNull(message = "Exercise ID is required")
        UUID exerciseId,

        @NotNull @Min(1)
        Integer plannedSets,

        Integer plannedRepsMin,
        Integer plannedRepsMax,
        BigDecimal plannedWeightKg,

        @Min(0)
        Integer restSeconds,

        String notes
) {}
