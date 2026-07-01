package com.treinus.achievements;

public record Achievement(
        String code,
        String name,
        String description,
        AchievementCategory category,
        AchievementTier tier,
        String icon
) {
    public int xpReward() {
        return tier.getXpReward();
    }
}
