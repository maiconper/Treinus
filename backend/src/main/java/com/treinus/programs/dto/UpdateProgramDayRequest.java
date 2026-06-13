package com.treinus.programs.dto;

import java.util.UUID;

public record UpdateProgramDayRequest(
        UUID workoutId,
        boolean restDay
) {}
