package com.treinus.sessions.dto;

import com.treinus.sessions.SessionExercise;
import com.treinus.sessions.SessionExerciseStatus;

import java.util.List;
import java.util.UUID;

public record SessionExerciseResponse(
        UUID id,
        UUID exerciseId,
        String exerciseName,
        int orderIndex,
        SessionExerciseStatus status,
        String skipReason,
        List<SessionSetResponse> sets
) {
    public static SessionExerciseResponse from(SessionExercise se) {
        List<SessionSetResponse> sets = se.getSets().stream()
                .map(SessionSetResponse::from)
                .toList();

        return new SessionExerciseResponse(
                se.getId(),
                se.getExercise().getId(),
                se.getExercise().getName(),
                se.getOrderIndex(),
                se.getStatus(),
                se.getSkipReason(),
                sets
        );
    }
}
