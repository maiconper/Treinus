-- Programs, weeks and days

CREATE TABLE programs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(150) NOT NULL,
    description TEXT,
    user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    weeks_count SMALLINT,
    status      VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    started_at  TIMESTAMPTZ,
    ended_at    TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_programs_user_id ON programs (user_id);
CREATE INDEX idx_programs_user_status ON programs (user_id, status);

CREATE TABLE program_weeks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id  UUID NOT NULL REFERENCES programs (id) ON DELETE CASCADE,
    week_number SMALLINT NOT NULL,
    name        VARCHAR(100),
    UNIQUE (program_id, week_number)
);

CREATE INDEX idx_program_weeks_program_id ON program_weeks (program_id);

CREATE TABLE program_days (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_week_id UUID NOT NULL REFERENCES program_weeks (id) ON DELETE CASCADE,
    day_of_week     SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    workout_id      UUID REFERENCES workouts (id) ON DELETE SET NULL,
    is_rest_day     BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (program_week_id, day_of_week)
);

CREATE INDEX idx_program_days_week_id ON program_days (program_week_id);
