package com.treinus.programs.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateProgramRequest(
        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 150)
        String name,

        String description,

        @Min(1)
        Integer weeksCount
) {}
