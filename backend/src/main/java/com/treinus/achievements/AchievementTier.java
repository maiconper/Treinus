package com.treinus.achievements;

public enum AchievementTier {
    BRONZE(25), SILVER(50), GOLD(100), PLATINUM(250);

    private final int xpReward;

    AchievementTier(int xpReward) {
        this.xpReward = xpReward;
    }

    public int getXpReward() {
        return xpReward;
    }
}
