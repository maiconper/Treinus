-- Users and profiles

CREATE TABLE users (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email        VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name         VARCHAR(100) NOT NULL,
    role         VARCHAR(20) NOT NULL DEFAULT 'USER',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);

CREATE TABLE user_profiles (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    fitness_level            VARCHAR(20),
    goal                     VARCHAR(30),
    available_days_per_week  SMALLINT CHECK (available_days_per_week BETWEEN 1 AND 7),
    body_weight_kg           NUMERIC(5, 2),
    height_cm                SMALLINT CHECK (height_cm BETWEEN 50 AND 300),
    birth_date               DATE,
    xp                       INTEGER NOT NULL DEFAULT 0,
    streak                   INTEGER NOT NULL DEFAULT 0,
    last_workout_date        DATE,
    onboarding_completed     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
