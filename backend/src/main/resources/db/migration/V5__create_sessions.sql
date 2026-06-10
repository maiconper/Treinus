-- Training sessions, session exercises and sets

CREATE TABLE training_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    workout_id      UUID REFERENCES workouts (id) ON DELETE SET NULL,
    program_day_id  UUID REFERENCES program_days (id) ON DELETE SET NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at     TIMESTAMPTZ,
    notes           TEXT,
    total_volume_kg NUMERIC(10, 2),
    xp_earned       INTEGER DEFAULT 0
);

CREATE INDEX idx_training_sessions_user_id ON training_sessions (user_id);
CREATE INDEX idx_training_sessions_user_status ON training_sessions (user_id, status);
CREATE INDEX idx_training_sessions_started_at ON training_sessions (started_at DESC);

CREATE TABLE session_exercises (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID NOT NULL REFERENCES training_sessions (id) ON DELETE CASCADE,
    exercise_id         UUID NOT NULL REFERENCES exercises (id) ON DELETE RESTRICT,
    workout_exercise_id UUID REFERENCES workout_exercises (id) ON DELETE SET NULL,
    order_index         SMALLINT NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    skip_reason         TEXT
);

CREATE INDEX idx_session_exercises_session_id ON session_exercises (session_id);

CREATE TABLE session_sets (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_exercise_id UUID NOT NULL REFERENCES session_exercises (id) ON DELETE CASCADE,
    set_number          SMALLINT NOT NULL,
    reps                SMALLINT NOT NULL,
    weight_kg           NUMERIC(6, 2) NOT NULL,
    completed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_personal_record  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_session_sets_session_exercise_id ON session_sets (session_exercise_id);
