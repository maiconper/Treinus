-- Seed: treinos preset adicionais — Upper/Lower, Full Body, Core

DO $$
DECLARE
  v_system UUID;
  w_id     UUID;
BEGIN
  SELECT id INTO v_system FROM users WHERE email = 'system@treinus.app';

  -- ── UPPER A: Peito + Costas (Força) ───────────────────────────────────────
  INSERT INTO workouts (name, description, user_id)
  VALUES ('Upper A — Peito e Costas', 'Treino superior com foco em força: supino, remada e variações.', v_system)
  RETURNING id INTO w_id;

  INSERT INTO workout_exercises
        (workout_id, exercise_id, order_index, planned_sets, planned_reps_min, planned_reps_max, rest_seconds)
  VALUES
  (w_id, (SELECT id FROM exercises WHERE name = 'Supino reto com barra'         AND is_global), 1, 4, 5,  8,  120),
  (w_id, (SELECT id FROM exercises WHERE name = 'Remada curvada com barra'      AND is_global), 2, 4, 5,  8,  120),
  (w_id, (SELECT id FROM exercises WHERE name = 'Supino inclinado com halteres' AND is_global), 3, 3, 8,  10,  90),
  (w_id, (SELECT id FROM exercises WHERE name = 'Puxada frontal'                AND is_global), 4, 3, 8,  10,  90),
  (w_id, (SELECT id FROM exercises WHERE name = 'Crucifixo plano'               AND is_global), 5, 3, 12, 15,  60),
  (w_id, (SELECT id FROM exercises WHERE name = 'Face pull'                     AND is_global), 6, 3, 12, 15,  60);

  -- ── UPPER B: Ombros + Braços ──────────────────────────────────────────────
  INSERT INTO workouts (name, description, user_id)
  VALUES ('Upper B — Ombros e Braços', 'Treino superior com foco em deltóides, bíceps e tríceps.', v_system)
  RETURNING id INTO w_id;

  INSERT INTO workout_exercises
        (workout_id, exercise_id, order_index, planned_sets, planned_reps_min, planned_reps_max, rest_seconds)
  VALUES
  (w_id, (SELECT id FROM exercises WHERE name = 'Desenvolvimento com halteres' AND is_global), 1, 4, 8,  12, 90),
  (w_id, (SELECT id FROM exercises WHERE name = 'Elevação lateral'             AND is_global), 2, 4, 12, 15, 60),
  (w_id, (SELECT id FROM exercises WHERE name = 'Remada alta com barra'        AND is_global), 3, 3, 12, 15, 60),
  (w_id, (SELECT id FROM exercises WHERE name = 'Rosca alternada'              AND is_global), 4, 3, 10, 12, 60),
  (w_id, (SELECT id FROM exercises WHERE name = 'Tríceps francês'              AND is_global), 5, 3, 10, 12, 60),
  (w_id, (SELECT id FROM exercises WHERE name = 'Rosca martelo'                AND is_global), 6, 3, 12, 15, 60),
  (w_id, (SELECT id FROM exercises WHERE name = 'Tríceps corda'                AND is_global), 7, 3, 12, 15, 60);

  -- ── LOWER A: Quadríceps ───────────────────────────────────────────────────
  INSERT INTO workouts (name, description, user_id)
  VALUES ('Lower A — Quadríceps', 'Treino inferior com foco em quadríceps: agachamento e variações.', v_system)
  RETURNING id INTO w_id;

  INSERT INTO workout_exercises
        (workout_id, exercise_id, order_index, planned_sets, planned_reps_min, planned_reps_max, rest_seconds)
  VALUES
  (w_id, (SELECT id FROM exercises WHERE name = 'Agachamento livre'   AND is_global), 1, 4, 8,  10, 120),
  (w_id, (SELECT id FROM exercises WHERE name = 'Leg press 45°'       AND is_global), 2, 4, 10, 12,  90),
  (w_id, (SELECT id FROM exercises WHERE name = 'Extensão de joelho'  AND is_global), 3, 3, 12, 15,  60),
  (w_id, (SELECT id FROM exercises WHERE name = 'Agachamento búlgaro' AND is_global), 4, 3, 10, 12,  90),
  (w_id, (SELECT id FROM exercises WHERE name = 'Adutor máquina'      AND is_global), 5, 3, 12, 15,  60),
  (w_id, (SELECT id FROM exercises WHERE name = 'Panturrilha em pé'   AND is_global), 6, 4, 15, 20,  45);

  -- ── LOWER B: Isquiotibiais + Glúteos ─────────────────────────────────────
  INSERT INTO workouts (name, description, user_id)
  VALUES ('Lower B — Posterior e Glúteos', 'Treino inferior com foco em isquiotibiais e glúteos.', v_system)
  RETURNING id INTO w_id;

  INSERT INTO workout_exercises
        (workout_id, exercise_id, order_index, planned_sets, planned_reps_min, planned_reps_max, rest_seconds)
  VALUES
  (w_id, (SELECT id FROM exercises WHERE name = 'Levantamento terra romeno' AND is_global), 1, 4, 8,  10, 120),
  (w_id, (SELECT id FROM exercises WHERE name = 'Hip thrust com barra'      AND is_global), 2, 4, 8,  12,  90),
  (w_id, (SELECT id FROM exercises WHERE name = 'Cadeira flexora'           AND is_global), 3, 3, 10, 12,  60),
  (w_id, (SELECT id FROM exercises WHERE name = 'Mesa flexora'              AND is_global), 4, 3, 12, 15,  60),
  (w_id, (SELECT id FROM exercises WHERE name = 'Abdutor máquina'          AND is_global), 5, 3, 15, 20,  45),
  (w_id, (SELECT id FROM exercises WHERE name = 'Panturrilha sentado'       AND is_global), 6, 4, 15, 20,  45);

  -- ── FULL BODY: Força ──────────────────────────────────────────────────────
  INSERT INTO workouts (name, description, user_id)
  VALUES ('Full Body — Força', 'Corpo todo baseado em movimentos compostos: levantamento terra, agachamento, supino.', v_system)
  RETURNING id INTO w_id;

  INSERT INTO workout_exercises
        (workout_id, exercise_id, order_index, planned_sets, planned_reps_min, planned_reps_max, rest_seconds)
  VALUES
  (w_id, (SELECT id FROM exercises WHERE name = 'Levantamento terra'       AND is_global), 1, 4, 4,  6,  180),
  (w_id, (SELECT id FROM exercises WHERE name = 'Agachamento livre'        AND is_global), 2, 3, 5,  8,  150),
  (w_id, (SELECT id FROM exercises WHERE name = 'Supino reto com barra'    AND is_global), 3, 3, 6,  8,  120),
  (w_id, (SELECT id FROM exercises WHERE name = 'Barra fixa pronada'       AND is_global), 4, 3, 6,  10, 120),
  (w_id, (SELECT id FROM exercises WHERE name = 'Desenvolvimento com barra' AND is_global), 5, 3, 8,  10,  90),
  (w_id, (SELECT id FROM exercises WHERE name = 'Rosca direta com barra'   AND is_global), 6, 2, 10, 12,  60),
  (w_id, (SELECT id FROM exercises WHERE name = 'Tríceps pulley'           AND is_global), 7, 2, 10, 12,  60);

  -- ── CORE: Abdômen e Estabilidade ──────────────────────────────────────────
  INSERT INTO workouts (name, description, user_id)
  VALUES ('Core — Abdômen e Estabilidade', 'Trabalho de core completo: reto abdominal, oblíquos e estabilidade.', v_system)
  RETURNING id INTO w_id;

  INSERT INTO workout_exercises
        (workout_id, exercise_id, order_index, planned_sets, planned_reps_min, planned_reps_max, rest_seconds)
  VALUES
  (w_id, (SELECT id FROM exercises WHERE name = 'Prancha'            AND is_global), 1, 4, 30, 60, 60),
  (w_id, (SELECT id FROM exercises WHERE name = 'Abdominal supra'    AND is_global), 2, 3, 20, 25, 45),
  (w_id, (SELECT id FROM exercises WHERE name = 'Elevação de pernas' AND is_global), 3, 3, 15, 20, 45),
  (w_id, (SELECT id FROM exercises WHERE name = 'Russian twist'      AND is_global), 4, 3, 20, 25, 45),
  (w_id, (SELECT id FROM exercises WHERE name = 'Abdominal oblíquo'  AND is_global), 5, 3, 15, 20, 45),
  (w_id, (SELECT id FROM exercises WHERE name = 'Abdominal no cabo'  AND is_global), 6, 3, 12, 15, 60);

END $$;
