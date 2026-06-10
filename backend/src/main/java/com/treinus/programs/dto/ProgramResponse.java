package com.treinus.programs.dto;

import com.treinus.programs.Program;
import com.treinus.programs.ProgramStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ProgramResponse(
        UUID id,
        String name,
        String description,
        UUID userId,
        Integer weeksCount,
        ProgramStatus status,
        Instant startedAt,
        Instant endedAt,
        List<ProgramWeekResponse> weeks,
        Instant createdAt,
        Instant updatedAt
) {
    public static ProgramResponse from(Program program) {
        List<ProgramWeekResponse> weeks = program.getWeeks().stream()
                .map(ProgramWeekResponse::from)
                .toList();

        return new ProgramResponse(
                program.getId(),
                program.getName(),
                program.getDescription(),
                program.getUser().getId(),
                program.getWeeksCount(),
                program.getStatus(),
                program.getStartedAt(),
                program.getEndedAt(),
                weeks,
                program.getCreatedAt(),
                program.getUpdatedAt()
        );
    }
}
