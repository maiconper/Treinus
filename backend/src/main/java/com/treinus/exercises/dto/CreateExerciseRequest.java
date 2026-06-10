package com.treinus.exercises.dto;

import com.treinus.exercises.Equipment;
import com.treinus.exercises.ExerciseCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateExerciseRequest(
        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 150)
        String name,

        String description,

        @NotNull(message = "Category is required")
        ExerciseCategory category,

        @Size(max = 100)
        String primaryMuscleGroup,

        Equipment equipment
) {}
