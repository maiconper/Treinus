package com.treinus.sessions.dto;

import com.treinus.sessions.SessionSet;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record SessionSetResponse(
        UUID id,
        int setNumber,
        int reps,
        BigDecimal weightKg,
        boolean personalRecord,
        Instant completedAt
) {
    public static SessionSetResponse from(SessionSet set) {
        return new SessionSetResponse(
                set.getId(),
                set.getSetNumber(),
                set.getReps(),
                set.getWeightKg(),
                set.isPersonalRecord(),
                set.getCompletedAt()
        );
    }
}
