package com.treinus.sessions.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record ManualSetEntry(
        @NotNull Integer reps,
        @NotNull BigDecimal weightKg
) {}
