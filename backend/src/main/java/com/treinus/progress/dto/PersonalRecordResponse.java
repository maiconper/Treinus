package com.treinus.progress.dto;

public record PersonalRecordResponse(
        String exerciseId,
        String exerciseName,
        String category,
        double weightKg,
        int reps,
        String achievedAt
) {}
