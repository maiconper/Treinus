CREATE TABLE user_achievements (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    code          VARCHAR(50) NOT NULL,
    unlocked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged  BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (user_id, code)
);

CREATE INDEX idx_user_achievements_user_id ON user_achievements (user_id);
