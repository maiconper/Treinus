-- Exercise catalog

CREATE TABLE exercises (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                 VARCHAR(150) NOT NULL,
    description          TEXT,
    category             VARCHAR(30) NOT NULL,
    primary_muscle_group VARCHAR(100),
    equipment            VARCHAR(30),
    is_global            BOOLEAN NOT NULL DEFAULT FALSE,
    created_by           UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exercises_category ON exercises (category);
CREATE INDEX idx_exercises_is_global ON exercises (is_global);
CREATE INDEX idx_exercises_created_by ON exercises (created_by);
