package com.treinus.workouts.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateWorkoutRequest(
        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 150)
        String name,

        String description
) {}
