package com.treinus.sessions.dto;

import com.treinus.sessions.SessionStatus;
import com.treinus.sessions.TrainingSession;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SessionResponse(
        UUID id,
        UUID userId,
        UUID workoutId,
        String workoutName,
        SessionStatus status,
        Instant startedAt,
        Instant finishedAt,
        String notes,
        BigDecimal totalVolumeKg,
        int xpEarned,
        List<SessionExerciseResponse> exercises
) {
    public static SessionResponse from(TrainingSession session) {
        List<SessionExerciseResponse> exercises = session.getExercises().stream()
                .map(SessionExerciseResponse::from)
                .toList();

        return new SessionResponse(
                session.getId(),
                session.getUser().getId(),
                session.getWorkout() != null ? session.getWorkout().getId() : null,
                session.getName() != null ? session.getName() : (session.getWorkout() != null ? session.getWorkout().getName() : "Treino"),
                session.getStatus(),
                session.getStartedAt(),
                session.getFinishedAt(),
                session.getNotes(),
                session.getTotalVolumeKg(),
                session.getXpEarned() != null ? session.getXpEarned() : 0,
                exercises
        );
    }
}
