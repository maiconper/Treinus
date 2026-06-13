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
        Integer plannedSets,
        Integer plannedRepsMin,
        Integer plannedRepsMax,
        Integer restSeconds,
        List<SessionSetResponse> sets
) {
    public static SessionExerciseResponse from(SessionExercise se) {
        var we = se.getWorkoutExercise();
        return new SessionExerciseResponse(
                se.getId(),
                se.getExercise().getId(),
                se.getExercise().getName(),
                se.getOrderIndex(),
                se.getStatus(),
                se.getSkipReason(),
                we != null ? we.getPlannedSets() : null,
                we != null ? we.getPlannedRepsMin() : null,
                we != null ? we.getPlannedRepsMax() : null,
                we != null ? we.getRestSeconds() : null,
                se.getSets().stream().map(SessionSetResponse::from).toList()
        );
    }
}
