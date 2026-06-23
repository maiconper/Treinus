package com.treinus.sessions.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public record ManualExerciseEntry(
        @NotNull UUID exerciseId,
        @NotNull List<ManualSetEntry> sets
) {}
