package com.treinus.sessions.dto;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SessionSummaryResponse(
        UUID sessionId,
        String workoutName,
        long durationSeconds,
        int totalSets,
        int totalReps,
        BigDecimal totalVolumeKg,
        int xpEarned,
        int newPersonalRecords,
        List<SessionExerciseResponse> exercises
) {}
