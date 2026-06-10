package com.treinus.users.dto;

import com.treinus.users.FitnessGoal;
import com.treinus.users.FitnessLevel;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record OnboardingRequest(
        @NotNull(message = "Fitness level is required")
        FitnessLevel fitnessLevel,

        @NotNull(message = "Goal is required")
        FitnessGoal goal,

        @NotNull(message = "Available days per week is required")
        @Min(1) @Max(7)
        Integer availableDaysPerWeek,

        BigDecimal bodyWeightKg,

        @Min(50) @Max(300)
        Integer heightCm,

        LocalDate birthDate
) {}
