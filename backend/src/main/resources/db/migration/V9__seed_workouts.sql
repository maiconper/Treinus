-- Seed: usuário de sistema e treinos preset (PPL)
-- O usuário SYSTEM não possui senha válida e não pode fazer login.

DO $$
DECLARE
  v_system UUID;
  w_push   UUID;
  w_pull   UUID;
  w_legs   UUID;
BEGIN

  -- Cria usuário SYSTEM uma única vez
  INSERT INTO users (email, password_hash, name, role)
  VALUES ('system@treinus.app', '!not-a-valid-hash', 'Treinus', 'SYSTEM')
  ON CONFLICT (email) DO NOTHING;

  SELECT id INTO v_system FROM users WHERE email = 'system@treinus.app';

  -- ── PUSH: Peito · Ombros · Tríceps ────────────────────────────────────────
  INSERT INTO workouts (name, description, user_id)
  VALUES ('Push — Peito, Ombros e Tríceps',
          'Treino de empurrar: peito, deltóides e tríceps.',
          v_system)
  RETURNING id INTO w_push;

  INSERT INTO workout_exercises
        (workout_id, exercise_id, order_index, planned_sets, planned_reps_min, planned_reps_max, rest_seconds)
  VALUES
  (w_push, (SELECT id FROM exercises WHERE name = 'Supino reto com barra'         AND is_global), 1, 4, 8,  12, 90),
  (w_push, (SELECT id FROM exercises WHERE name = 'Supino inclinado com halteres' AND is_global), 2, 3, 10, 12, 90),
  (w_push, (SELECT id FROM exercises WHERE name = 'Crucifixo plano'               AND is_global), 3, 3, 12, 15, 60),
  (w_push, (SELECT id FROM exercises WHERE name = 'Desenvolvimento com halteres'  AND is_global), 4, 3, 10, 12, 90),
  (w_push, (SELECT id FROM exercises WHERE name = 'Elevação lateral'              AND is_global), 5, 4, 12, 15, 60),
  (w_push, (SELECT id FROM exercises WHERE name = 'Tríceps pulley'                AND is_global), 6, 3, 12, 15, 60),
  (w_push, (SELECT id FROM exercises WHERE name = 'Tríceps corda'                 AND is_global), 7, 3, 12, 15, 60);

  -- ── PULL: Costas · Bíceps ─────────────────────────────────────────────────
  INSERT INTO workouts (name, description, user_id)
  VALUES ('Pull — Costas e Bíceps',
          'Treino de puxar: dorsais, romboides e bíceps.',
          v_system)
  RETURNING id INTO w_pull;

  INSERT INTO workout_exercises
        (workout_id, exercise_id, order_index, planned_sets, planned_reps_min, planned_reps_max, rest_seconds)
  VALUES
  (w_pull, (SELECT id FROM exercises WHERE name = 'Barra fixa pronada'            AND is_global), 1, 4, 6,  10, 120),
  (w_pull, (SELECT id FROM exercises WHERE name = 'Remada curvada com barra'      AND is_global), 2, 4, 8,  12,  90),
  (w_pull, (SELECT id FROM exercises WHERE name = 'Puxada frontal'                AND is_global), 3, 3, 10, 12,  90),
  (w_pull, (SELECT id FROM exercises WHERE name = 'Remada unilateral com haltere' AND is_global), 4, 3, 10, 12,  60),
  (w_pull, (SELECT id FROM exercises WHERE name = 'Face pull'                     AND is_global), 5, 3, 12, 15,  60),
  (w_pull, (SELECT id FROM exercises WHERE name = 'Rosca direta com barra'        AND is_global), 6, 3, 10, 12,  60),
  (w_pull, (SELECT id FROM exercises WHERE name = 'Rosca martelo'                 AND is_global), 7, 3, 12, 15,  60);

  -- ── LEGS: Pernas · Glúteos · Panturrilha ──────────────────────────────────
  INSERT INTO workouts (name, description, user_id)
  VALUES ('Legs — Pernas e Glúteos',
          'Treino de pernas completo: quadríceps, posteriores, glúteos e panturrilha.',
          v_system)
  RETURNING id INTO w_legs;

  INSERT INTO workout_exercises
        (workout_id, exercise_id, order_index, planned_sets, planned_reps_min, planned_reps_max, rest_seconds)
  VALUES
  (w_legs, (SELECT id FROM exercises WHERE name = 'Agachamento livre'    AND is_global), 1, 4, 8,  12, 120),
  (w_legs, (SELECT id FROM exercises WHERE name = 'Leg press 45°'        AND is_global), 2, 4, 10, 12,  90),
  (w_legs, (SELECT id FROM exercises WHERE name = 'Extensão de joelho'   AND is_global), 3, 3, 12, 15,  60),
  (w_legs, (SELECT id FROM exercises WHERE name = 'Cadeira flexora'      AND is_global), 4, 3, 12, 15,  60),
  (w_legs, (SELECT id FROM exercises WHERE name = 'Stiff com barra'      AND is_global), 5, 3, 10, 12,  90),
  (w_legs, (SELECT id FROM exercises WHERE name = 'Hip thrust com barra' AND is_global), 6, 3, 10, 12,  90),
  (w_legs, (SELECT id FROM exercises WHERE name = 'Panturrilha em pé'    AND is_global), 7, 4, 15, 20,  45);

END $$;
