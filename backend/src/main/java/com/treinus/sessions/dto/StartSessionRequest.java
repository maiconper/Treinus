package com.treinus.sessions.dto;

import java.util.UUID;

public record StartSessionRequest(
        UUID workoutId,
        UUID programDayId,
        String notes
) {}
