package com.treinus.achievements.dto;

import com.treinus.achievements.Achievement;

import java.time.Instant;

public record AchievementResponse(
        String code,
        String name,
        String description,
        String category,
        String tier,
        String icon,
        int xpReward,
        boolean unlocked,
        Instant unlockedAt,
        boolean isNew
) {
    public static AchievementResponse locked(Achievement achievement) {
        return new AchievementResponse(
                achievement.code(),
                achievement.name(),
                achievement.description(),
                achievement.category().name(),
                achievement.tier().name(),
                achievement.icon(),
                achievement.xpReward(),
                false,
                null,
                false);
    }

    public static AchievementResponse unlocked(Achievement achievement, Instant unlockedAt, boolean isNew) {
        return new AchievementResponse(
                achievement.code(),
                achievement.name(),
                achievement.description(),
                achievement.category().name(),
                achievement.tier().name(),
                achievement.icon(),
                achievement.xpReward(),
                true,
                unlockedAt,
                isNew);
    }
}
