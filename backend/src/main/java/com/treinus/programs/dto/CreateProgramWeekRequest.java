package com.treinus.programs.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CreateProgramWeekRequest(
        @NotNull @Min(1)
        Integer weekNumber,

        String name
) {}
