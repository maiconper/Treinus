package com.treinus.progress.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ProgressSummaryResponse(
        int xp,
        int streak,
        int totalWorkouts,
        int workoutsThisWeek,
        BigDecimal volumeThisWeek,
        BigDecimal volumeLastWeek,
        LocalDate lastWorkoutDate
) {}
