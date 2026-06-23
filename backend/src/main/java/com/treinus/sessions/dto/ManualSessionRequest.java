package com.treinus.sessions.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record ManualSessionRequest(
        UUID workoutId,
        UUID programDayId,
        String name,
        @NotNull LocalDate date,
        List<ManualExerciseEntry> exercises
) {}
