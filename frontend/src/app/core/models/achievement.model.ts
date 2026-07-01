export type AchievementCategory =
  | 'FREQUENCY'
  | 'CONSISTENCY'
  | 'RECORDS'
  | 'VOLUME'
  | 'PROGRAMS'
  | 'EXPLORATION'
  | 'RESILIENCE';

export type AchievementTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface Achievement {
  code: string;
  name: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt: string | null;
  isNew: boolean;
}
