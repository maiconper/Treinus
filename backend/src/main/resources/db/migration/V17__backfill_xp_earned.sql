-- Backfill xp_earned for completed sessions using: 100 base + 50 per PR set
-- Streak bonus is not applied to historical data (streak was not recorded at session time)

UPDATE training_sessions ts
SET xp_earned = 100 + (
    SELECT COUNT(*) * 50
    FROM session_exercises se
    JOIN session_sets ss ON ss.session_exercise_id = se.id
    WHERE se.session_id = ts.id
      AND ss.is_personal_record = TRUE
)
WHERE ts.status = 'COMPLETED'
  AND ts.xp_earned = 0;

-- Recalculate cumulative XP in user_profiles from all completed sessions
UPDATE user_profiles up
SET xp = (
    SELECT COALESCE(SUM(ts.xp_earned), 0)
    FROM training_sessions ts
    WHERE ts.user_id = up.user_id
      AND ts.status = 'COMPLETED'
);
