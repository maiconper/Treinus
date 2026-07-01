package com.treinus.progress.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ProgressSummaryResponse(
        int xp,
        int streak,
        int level,
        int xpInCurrentLevel,
        int xpForCurrentLevel,
        int totalWorkouts,
        int workoutsThisWeek,
        BigDecimal volumeThisWeek,
        BigDecimal volumeLastWeek,
        LocalDate lastWorkoutDate,
        long totalSets,
        long totalDurationSeconds,
        long avgDurationSeconds,
        long totalPersonalRecords
) {}
