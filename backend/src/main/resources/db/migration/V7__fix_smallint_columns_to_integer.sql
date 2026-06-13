ALTER TABLE user_profiles
    ALTER COLUMN available_days_per_week TYPE INTEGER,
    ALTER COLUMN height_cm TYPE INTEGER;

ALTER TABLE workout_exercises
    ALTER COLUMN order_index TYPE INTEGER,
    ALTER COLUMN planned_sets TYPE INTEGER,
    ALTER COLUMN planned_reps_min TYPE INTEGER,
    ALTER COLUMN planned_reps_max TYPE INTEGER,
    ALTER COLUMN rest_seconds TYPE INTEGER;

ALTER TABLE programs
    ALTER COLUMN weeks_count TYPE INTEGER;

ALTER TABLE program_weeks
    ALTER COLUMN week_number TYPE INTEGER;

ALTER TABLE session_exercises
    ALTER COLUMN order_index TYPE INTEGER;

ALTER TABLE session_sets
    ALTER COLUMN set_number TYPE INTEGER,
    ALTER COLUMN reps TYPE INTEGER;
