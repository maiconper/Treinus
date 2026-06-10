package com.treinus.sessions.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record RecordSetRequest(
        @NotNull @Min(1)
        Integer reps,

        @NotNull
        BigDecimal weightKg
) {}
