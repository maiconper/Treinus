package com.treinus.programs.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateProgramDayRequest(
        @NotNull
        @Min(1) @Max(7)
        Integer dayOfWeek,

        UUID workoutId,

        boolean restDay
) {}
