package com.treinus.progress.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ExerciseProgressResponse(
        UUID exerciseId,
        String exerciseName,
        BigDecimal personalRecord,
        int totalSets,
        List<SetHistoryEntry> history
) {
    public record SetHistoryEntry(
            Instant completedAt,
            int reps,
            BigDecimal weightKg,
            boolean personalRecord
    ) {}
}
