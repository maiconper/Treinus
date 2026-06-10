package com.treinus.workouts.dto;

import jakarta.validation.constraints.Min;

import java.math.BigDecimal;

public record UpdateWorkoutExerciseRequest(
        @Min(1)
        Integer plannedSets,

        Integer plannedRepsMin,
        Integer plannedRepsMax,
        BigDecimal plannedWeightKg,

        @Min(0)
        Integer restSeconds,

        String notes
) {}
