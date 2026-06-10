package com.treinus.users.dto;

import com.treinus.users.FitnessGoal;
import com.treinus.users.FitnessLevel;
import com.treinus.users.User;
import com.treinus.users.UserProfile;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String name,
        String email,
        String role,
        FitnessLevel fitnessLevel,
        FitnessGoal goal,
        Integer availableDaysPerWeek,
        BigDecimal bodyWeightKg,
        Integer heightCm,
        LocalDate birthDate,
        Integer xp,
        Integer streak,
        LocalDate lastWorkoutDate,
        boolean onboardingCompleted,
        Instant createdAt
) {
    public static UserResponse from(User user, UserProfile profile) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                profile != null ? profile.getFitnessLevel() : null,
                profile != null ? profile.getGoal() : null,
                profile != null ? profile.getAvailableDaysPerWeek() : null,
                profile != null ? profile.getBodyWeightKg() : null,
                profile != null ? profile.getHeightCm() : null,
                profile != null ? profile.getBirthDate() : null,
                profile != null ? profile.getXp() : 0,
                profile != null ? profile.getStreak() : 0,
                profile != null ? profile.getLastWorkoutDate() : null,
                profile != null && Boolean.TRUE.equals(profile.getOnboardingCompleted()),
                user.getCreatedAt()
        );
    }
}
