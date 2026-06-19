package com.treinus.programs.dto;

import com.treinus.programs.ProgramDay;

import java.util.UUID;

public record ProgramDayResponse(
        UUID id,
        int dayOfWeek,
        UUID workoutId,
        String workoutName,
        boolean restDay,
        boolean completed,
        UUID lastSessionId
) {
    public static ProgramDayResponse from(ProgramDay day, boolean completed, UUID lastSessionId) {
        return new ProgramDayResponse(
                day.getId(),
                day.getDayOfWeek(),
                day.getWorkout() != null ? day.getWorkout().getId() : null,
                day.getWorkout() != null ? day.getWorkout().getName() : null,
                day.isRestDay(),
                completed,
                lastSessionId
        );
    }

    public static ProgramDayResponse from(ProgramDay day) {
        return from(day, false, null);
    }
}
