package com.treinus.shared;

public class XpCalculator {

    public static int levelFromXp(int xp) {
        if (xp <= 0) return 0;
        int level = (int) (Math.log(xp / 5000.0 + 1) / Math.log(1.2));
        // Ajuste por imprecisão de ponto flutuante
        while (totalXpForLevel(level + 1) <= xp) level++;
        return level;
    }

    public static int totalXpForLevel(int level) {
        if (level <= 0) return 0;
        return (int) Math.round(5000.0 * (Math.pow(1.2, level) - 1));
    }

    public static int xpInCurrentLevel(int xp) {
        return xp - totalXpForLevel(levelFromXp(xp));
    }

    public static int xpForCurrentLevel(int level) {
        return totalXpForLevel(level + 1) - totalXpForLevel(level);
    }
}
