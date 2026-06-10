package com.treinus.programs.dto;

import com.treinus.programs.ProgramWeek;

import java.util.List;
import java.util.UUID;

public record ProgramWeekResponse(
        UUID id,
        int weekNumber,
        String name,
        List<ProgramDayResponse> days
) {
    public static ProgramWeekResponse from(ProgramWeek week) {
        List<ProgramDayResponse> days = week.getDays().stream()
                .map(ProgramDayResponse::from)
                .toList();

        return new ProgramWeekResponse(week.getId(), week.getWeekNumber(), week.getName(), days);
    }
}
