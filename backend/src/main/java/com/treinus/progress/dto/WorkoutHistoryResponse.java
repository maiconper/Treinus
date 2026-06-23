package com.treinus.progress.dto;

import com.treinus.sessions.TrainingSession;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record WorkoutHistoryResponse(
        UUID sessionId,
        UUID workoutId,
        String workoutName,
        Instant startedAt,
        Instant finishedAt,
        long durationSeconds,
        int totalSets,
        BigDecimal totalVolumeKg,
        int xpEarned
) {
    public static WorkoutHistoryResponse from(TrainingSession session, int totalSets) {
        long duration = 0;
        if (session.getFinishedAt() != null) {
            duration = java.time.Duration.between(session.getStartedAt(), session.getFinishedAt()).getSeconds();
        }

        return new WorkoutHistoryResponse(
                session.getId(),
                session.getWorkout() != null ? session.getWorkout().getId() : null,
                session.getName() != null ? session.getName() : (session.getWorkout() != null ? session.getWorkout().getName() : "Treino"),
                session.getStartedAt(),
                session.getFinishedAt(),
                duration,
                totalSets,
                session.getTotalVolumeKg(),
                session.getXpEarned() != null ? session.getXpEarned() : 0
        );
    }
}
