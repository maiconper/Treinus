package com.treinus.programs.dto;

import com.treinus.programs.ProgramWeek;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public record ProgramWeekResponse(
        UUID id,
        int weekNumber,
        String name,
        List<ProgramDayResponse> days
) {
    public static ProgramWeekResponse from(ProgramWeek week, Map<UUID, UUID> completedDays) {
        List<ProgramDayResponse> days = week.getDays().stream()
                .map(day -> {
                    UUID sessionId = completedDays.get(day.getId());
                    return ProgramDayResponse.from(day, sessionId != null, sessionId);
                })
                .toList();

        return new ProgramWeekResponse(week.getId(), week.getWeekNumber(), week.getName(), days);
    }

    public static ProgramWeekResponse from(ProgramWeek week) {
        return from(week, Map.of());
    }
}
