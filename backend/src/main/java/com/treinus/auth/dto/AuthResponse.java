package com.treinus.auth.dto;

import java.util.UUID;

public record AuthResponse(
        UUID userId,
        String name,
        String email,
        String role,
        String accessToken,
        String refreshToken,
        long accessTokenExpiresIn,
        boolean onboardingCompleted
) {}
