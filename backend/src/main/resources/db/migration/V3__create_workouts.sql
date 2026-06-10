-- Workouts and workout exercises

CREATE TABLE workouts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(150) NOT NULL,
    description TEXT,
    user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workouts_user_id ON workouts (user_id);

CREATE TABLE workout_exercises (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id        UUID NOT NULL REFERENCES workouts (id) ON DELETE CASCADE,
    exercise_id       UUID NOT NULL REFERENCES exercises (id) ON DELETE RESTRICT,
    order_index       SMALLINT NOT NULL,
    planned_sets      SMALLINT NOT NULL DEFAULT 3,
    planned_reps_min  SMALLINT,
    planned_reps_max  SMALLINT,
    planned_weight_kg NUMERIC(6, 2),
    rest_seconds      SMALLINT DEFAULT 60,
    notes             TEXT,
    UNIQUE (workout_id, order_index)
);

CREATE INDEX idx_workout_exercises_workout_id ON workout_exercises (workout_id);
