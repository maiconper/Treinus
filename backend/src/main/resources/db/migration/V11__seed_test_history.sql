-- Seed: 2 meses de histórico PPL (6x/semana) para teste@gmail.com
-- Período: 15 Apr → 13 Jun 2026  |  Seg=Push  Ter=Pull  Qua=Legs  Qui=Push  Sex=Pull  Sáb=Legs

DO $$
DECLARE
  v_user       UUID;
  v_push_id    UUID;
  v_pull_id    UUID;
  v_legs_id    UUID;

  -- Push
  e_supino     UUID; e_sup_inc  UUID; e_crucifixo UUID;
  e_desenv     UUID; e_elev_lat UUID; e_tri_pull  UUID; e_tri_cord  UUID;

  -- Pull
  e_barra_fixa UUID; e_rem_curv UUID; e_puxada    UUID;
  e_rem_uni    UUID; e_face_pull UUID; e_rosca_dir UUID; e_rosca_mart UUID;

  -- Legs
  e_agach      UUID; e_leg_press UUID; e_ext_joe   UUID;
  e_cad_flex   UUID; e_stiff     UUID; e_hip_thr   UUID; e_pantur    UUID;

  v_sess_id    UUID;
  v_se_id      UUID;
  v_started    TIMESTAMPTZ;
  v_finished   TIMESTAMPTZ;
  v_vol        NUMERIC(10,2);
  v_xp         INTEGER;
  v_is_pr      BOOLEAN;

  day_off      INTEGER;
  cur_date     DATE;
  dow          INTEGER;
  wk           INTEGER;   -- número da semana (1–9)
  t            INTEGER;   -- minutos decorridos na sessão

  -- Pesos (reatribuídos em cada bloco)
  w1 NUMERIC; w2 NUMERIC; w3 NUMERIC; w4 NUMERIC;
  w5 NUMERIC; w6 NUMERIC; w7 NUMERIC;

BEGIN
  -- ── Lookups ────────────────────────────────────────────────────────────────
  SELECT id INTO v_user FROM users WHERE email = 'teste@gmail.com';
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Usuário teste@gmail.com não encontrado';
  END IF;

  -- Evita duplicação se a migration rodar mais de uma vez
  IF EXISTS (SELECT 1 FROM training_sessions WHERE user_id = v_user LIMIT 1) THEN
    RAISE NOTICE 'Histórico já existe para teste@gmail.com — pulando.';
    RETURN;
  END IF;

  SELECT w.id INTO v_push_id FROM workouts w JOIN users u ON w.user_id = u.id
   WHERE w.name = 'Push — Peito, Ombros e Tríceps' AND u.email = 'system@treinus.app';

  SELECT w.id INTO v_pull_id FROM workouts w JOIN users u ON w.user_id = u.id
   WHERE w.name = 'Pull — Costas e Bíceps' AND u.email = 'system@treinus.app';

  SELECT w.id INTO v_legs_id FROM workouts w JOIN users u ON w.user_id = u.id
   WHERE w.name = 'Legs — Pernas e Glúteos' AND u.email = 'system@treinus.app';

  -- Push exercises
  SELECT id INTO e_supino     FROM exercises WHERE name = 'Supino reto com barra'         AND is_global;
  SELECT id INTO e_sup_inc    FROM exercises WHERE name = 'Supino inclinado com halteres' AND is_global;
  SELECT id INTO e_crucifixo  FROM exercises WHERE name = 'Crucifixo plano'               AND is_global;
  SELECT id INTO e_desenv     FROM exercises WHERE name = 'Desenvolvimento com halteres'  AND is_global;
  SELECT id INTO e_elev_lat   FROM exercises WHERE name = 'Elevação lateral'              AND is_global;
  SELECT id INTO e_tri_pull   FROM exercises WHERE name = 'Tríceps pulley'                AND is_global;
  SELECT id INTO e_tri_cord   FROM exercises WHERE name = 'Tríceps corda'                 AND is_global;

  -- Pull exercises
  SELECT id INTO e_barra_fixa  FROM exercises WHERE name = 'Barra fixa pronada'            AND is_global;
  SELECT id INTO e_rem_curv    FROM exercises WHERE name = 'Remada curvada com barra'      AND is_global;
  SELECT id INTO e_puxada      FROM exercises WHERE name = 'Puxada frontal'                AND is_global;
  SELECT id INTO e_rem_uni     FROM exercises WHERE name = 'Remada unilateral com haltere' AND is_global;
  SELECT id INTO e_face_pull   FROM exercises WHERE name = 'Face pull'                     AND is_global;
  SELECT id INTO e_rosca_dir   FROM exercises WHERE name = 'Rosca direta com barra'        AND is_global;
  SELECT id INTO e_rosca_mart  FROM exercises WHERE name = 'Rosca martelo'                 AND is_global;

  -- Legs exercises
  SELECT id INTO e_agach      FROM exercises WHERE name = 'Agachamento livre'    AND is_global;
  SELECT id INTO e_leg_press  FROM exercises WHERE name = 'Leg press 45°'        AND is_global;
  SELECT id INTO e_ext_joe    FROM exercises WHERE name = 'Extensão de joelho'   AND is_global;
  SELECT id INTO e_cad_flex   FROM exercises WHERE name = 'Cadeira flexora'      AND is_global;
  SELECT id INTO e_stiff      FROM exercises WHERE name = 'Stiff com barra'      AND is_global;
  SELECT id INTO e_hip_thr    FROM exercises WHERE name = 'Hip thrust com barra' AND is_global;
  SELECT id INTO e_pantur     FROM exercises WHERE name = 'Panturrilha em pé'    AND is_global;

  -- ── Loop de 60 dias ───────────────────────────────────────────────────────
  FOR day_off IN 0..59 LOOP
    cur_date := DATE '2026-04-15' + day_off;
    dow      := EXTRACT(DOW FROM cur_date)::INTEGER;  -- 0=Dom … 6=Sáb
    wk       := day_off / 7 + 1;                      -- semana 1–9

    CONTINUE WHEN dow = 0;  -- domingo = descanso

    -- Horário: manhã (Seg/Qua/Sex) ou noite (Ter/Qui/Sáb)
    IF dow IN (1, 3, 5) THEN
      v_started := (cur_date::TIMESTAMPTZ + INTERVAL '7 hours') + (day_off % 45) * INTERVAL '1 minute';
    ELSE
      v_started := (cur_date::TIMESTAMPTZ + INTERVAL '18 hours') + (day_off % 55) * INTERVAL '1 minute';
    END IF;
    v_finished := v_started + INTERVAL '65 minutes' + wk * INTERVAL '1 minute';

    -- ── PUSH  (Seg=1, Qui=4) ──────────────────────────────────────────────
    IF dow IN (1, 4) THEN
      w1 := 70 + (wk-1) * 2.5;   -- Supino reto
      w2 := 40 + (wk-1) * 2.0;   -- Supino inc halteres (total)
      w3 := 28 + (wk-1) * 1.0;   -- Crucifixo (total)
      w4 := 36 + (wk-1) * 2.0;   -- Desenvolvimento (total)
      w5 := 20 + (wk-1) * 1.0;   -- Elevação lateral (total)
      w6 := 25 + (wk-1) * 1.5;   -- Tríceps pulley
      w7 := 22 + (wk-1) * 1.0;   -- Tríceps corda

      INSERT INTO training_sessions (user_id, workout_id, status, started_at, finished_at, total_volume_kg, xp_earned)
      VALUES (v_user, v_push_id, 'COMPLETED', v_started, v_finished, 0, 0)
      RETURNING id INTO v_sess_id;

      v_vol := 0; t := 5;

      -- 1. Supino reto (4 séries)
      INSERT INTO session_exercises (session_id, exercise_id, order_index, status)
      VALUES (v_sess_id, e_supino, 1, 'COMPLETED') RETURNING id INTO v_se_id;
      v_is_pr := (wk IN (3,6) AND dow = 1);
      INSERT INTO session_sets (session_exercise_id, set_number, reps, weight_kg, is_personal_record, completed_at) VALUES
        (v_se_id, 1, 12, ROUND(w1*0.8,1), FALSE,   v_started + t       * INTERVAL '1 minute'),
        (v_se_id, 2, 10, w1,              v_is_pr, v_started + (t+4)  * INTERVAL '1 minute'),
        (v_se_id, 3,  8, w1,              FALSE,   v_started + (t+8)  * INTERVAL '1 minute'),
        (v_se_id, 4,  8, w1,              FALSE,   v_started + (t+12) * INTERVAL '1 minute');
      v_vol := v_vol + 12*ROUND(w1*0.8,1) + 26*w1;
      t := t + 16;

      -- 2. Supino inclinado halteres (3 séries)
      INSERT INTO session_exercises (session_id, exercise_id, order_index, status)
      VALUES (v_sess_id, e_sup_inc, 2, 'COMPLETED') RETURNING id INTO v_se_id;
      INSERT INTO session_sets (session_exercise_id, set_number, reps, weight_kg, is_personal_record, completed_at) VALUES
        (v_se_id, 1, 10, w2, FALSE, v_started + t      * INTERVAL '1 minute'),
        (v_se_id, 2, 10, w2, FALSE, v_started + (t+4)  * INTERVAL '1 minute'),
        (v_se_id, 3,  8, w2, FALSE, v_started + (t+8)  * INTERVAL '1 minute');
      v_vol := v_vol + 28*w2;
      t := t + 12;

      -- 3. Crucifixo (3 séries)
      INSERT INTO session_exercises (session_id, exercise_id, order_index, status)
      VALUES (v_sess_id, e_crucifixo, 3, 'COMPLETED') RETURNING id INTO v_se_id;
      INSERT INTO session_sets (session_exercise_id, set_number, reps, weight_kg, is_personal_record, completed_at) VALUES
        (v_se_id, 1, 15, w3, FALSE, v_started + t      * INTERVAL '1 minute'),
        (v_se_id, 2, 12, w3, FALSE, v_started + (t+3)  * INTERVAL '1 minute'),
        (v_se_id, 3, 12, w3, FALSE, v_started + (t+6)  * INTERVAL '1 minute');
      v_vol := v_vol + 39*w3;
      t := t + 9;

      -- 4. Desenvolvimento halteres (3 séries)
      INSERT INTO session_exercises (session_id, exercise_id, order_index, status)
      VALUES (v_sess_id, e_desenv, 4, 'COMPLETED') RETURNING id INTO v_se_id;
      INSERT INTO session_sets (session_exercise_id, set_number, reps, weight_kg, is_personal_record, completed_at) VALUES
        (v_se_id, 1, 12, w4, FALSE, v_started + t      * INTERVAL '1 minute'),
        (v_se_id, 2, 10, w4, FALSE, v_started + (t+4)  * INTERVAL '1 minute'),
        (v_se_id, 3, 10, w4, FALSE, v_started + (t+8)  * INTERVAL '1 minute');
      v_vol := v_vol + 32*w4;
      t := t + 11;

      -- 5. Elevação lateral (4 séries)
      INSERT INTO session_exercises (session_id, exercise_id, order_index, status)
      VALUES (v_sess_id, e_elev_lat, 5, 'COMPLETED') RETURNING id INTO v_se_id;
      INSERT INTO session_sets (session_exercise_id, set_number, reps, weight_kg, is_personal_record, completed_at) VALUES
        (v_se_id, 1, 15, w5, FALSE, v_started + t      * INTERVAL '1 minute'),
        (v_se_id, 2, 12, w5, FALSE, v_started + (t+3)  * INTERVAL '1 minute'),
        (v_se_id, 3, 12, w5, FALSE, v_started + (t+6)  * INTERVAL '1 minute'),
        (v_se_id, 4, 12, w5, FALSE, v_started + (t+9)  * INTERVAL '1 minute');
      v_vol := v_vol + 51*w5;
      t := t + 12;

      -- 6. Tríceps pulley (3 séries)
      INSERT INTO session_exercises (session_id, exercise_id, order_index, status)
      VALUES (v_sess_id, e_tri_pull, 6, 'COMPLETED') RETURNING id INTO v_se_id;
      INSERT INTO session_sets (session_exercise_id, set_number, reps, weight_kg, is_personal_record, completed_at) VALUES
        (v_se_id, 1, 15, w6, FALSE, v_started + t      * INTERVAL '1 minute'),
        (v_se_id, 2, 12, w6, FALSE, v_started + (t+3)  * INTERVAL '1 minute'),
        (v_se_id, 3, 12, w6, FALSE, v_started + (t+6)  * INTERVAL '1 minute');
      v_vol := v_vol + 39*w6;
      t := t + 9;

      -- 7. Tríceps corda (3 séries)
      INSERT INTO session_exercises (session_id, exercise_id, order_index, status)
      VALUES (v_sess_id, e_tri_cord, 7, 'COMPLETED') RETURNING id INTO v_se_id;
      INSERT INTO session_sets (session_exercise_id, set_number, reps, weight_kg, is_personal_record, completed_at) VALUES
        (v_se_id, 1, 15, w7, FALSE, v_started + t      * INTERVAL '1 minute'),
        (v_se_id, 2, 12, w7, FALSE, v_started + (t+3)  * INTERVAL '1 minute'),
        (v_se_id, 3, 12, w7, FALSE, v_started + (t+6)  * INTERVAL '1 minute');
      v_vol := v_vol + 39*w7;

      v_xp := 40 + (FLOOR(v_vol / 500) * 5)::INTEGER;
      UPDATE training_sessions SET total_volume_kg = v_vol, xp_earned = v_xp WHERE id = v_sess_id;

    -- ── PULL  (Ter=2, Sex=5) ──────────────────────────────────────────────
    ELSIF dow IN (2, 5) THEN
      w1 := 75 + (wk-1) * 2.0;   -- Barra fixa (peso corporal)
      w2 := 60 + (wk-1) * 2.5;   -- Remada curvada
      w3 := 55 + (wk-1) * 2.0;   -- Puxada frontal
      w4 := 44 + (wk-1) * 2.0;   -- Remada unilateral (total)
      w5 := 20 + (wk-1) * 1.0;   -- Face pull
      w6 := 35 + (wk-1) * 1.5;   -- Rosca direta
      w7 := 28 + (wk-1) * 1.0;   -- Rosca martelo (total)

      INSERT INTO training_sessions (user_id, workout_id, status, started_at, finished_at, total_volume_kg, xp_earned)
      VALUES (v_user, v_pull_id, 'COMPLETED', v_started, v_finished, 0, 0)
      RETURNING id INTO v_sess_id;

      v_vol := 0; t := 5;

      -- 1. Barra fixa (4 séries)
      INSERT INTO session_exercises (session_id, exercise_id, order_index, status)
      VALUES (v_sess_id, e_barra_fixa, 1, 'COMPLETED') RETURNING id INTO v_se_id;
      v_is_pr := (wk IN (2,5) AND dow = 2);
      INSERT INTO session_sets (session_exercise_id, set_number, reps, weight_kg, is_personal_record, completed_at) VALUES
        (v_se_id, 1, 8, w1, FALSE,   v_started + t       * INTERVAL '1 minute'),
        (v_se_id, 2, 7, w1, v_is_pr, v_started + (t+5)  * INTERVAL '1 minute'),
        (v_se_id, 3, 6, w1, FALSE,   v_started + (t+10) * INTERVAL '1 minute'),
        (v_se_id, 4, 5, w1, FALSE,   v_started + (t+15) * INTERVAL '1 minute');
      v_vol := v_vol + 26*w1;
      t := t + 19;

      -- 2. Remada curvada (4 séries)
      INSERT INTO session_exercises (session_id, exercise_id, order_index, status)
      VALUES (v_sess_id, e_rem_curv, 2, 'COMPLETED') RETURNING id INTO v_se_id;
      INSERT INTO session_sets (session_exercise_id, set_number, reps, weight_kg, is_personal_record, completed_at) VALUES
        (v_se_id, 1, 10, ROUND(w2*0.8,1), FALSE, v_started + t       * INTERVAL '1 minute'),
        (v_se_id, 2,  8, w2,              FALSE, v_started + (t+4)  * INTERVAL '1 minute'),
        (v_se_id, 3,  8, w2,              FALSE, v_started + (t+8)  * INTERVAL '1 minute'),
        (v_se_id, 4,  8, w2,              FALSE, v_started + (t+12) * INTERVAL '1 minute');
      v_vol := v_vol + 10*ROUND(w2*0.8,1) + 24*w2;
      t := t + 15;

      -- 3. Puxada frontal (3 séries)
      INSERT INTO session_exercises (session_id, exercise_id, order_index, status)
      VALUES (v_sess_id, e_puxada, 3, 'COMPLETED') RETURNING id INTO v_se_id;
      INSERT INTO session_sets (session_exercise_id, set_number, reps, weight_kg, is_personal_record, completed_at) VALUES
        (v_se_id, 1, 12, w3, FALSE, v_started + t      * INTERVAL '1 minute'),
        (v_se_id, 2, 10, w3, FALSE, v_started + (t+4)  * INTERVAL '1 minute'),
        (v_se_id, 3, 10, w3, FALSE, v_started + (t+8)  * INTERVAL '1 minute');
      v_vol := v_vol + 32*w3;
      t := t + 11;

      -- 4. Remada unilateral (3 séries)
      INSERT INTO session_exercises (session_id, exercise_id, order_index, status)
      VALUES (v_sess_id, e_rem_uni, 4, 'COMPLETED') RETURNING id INTO v_se_id;
      INSERT INTO session_sets (session_exercise_id, set_number, reps, weight_kg, is_personal_record, completed_at) VALUES
        (v_se_id, 1, 12, w4, FALSE, v_started + t      * INTERVAL '1 minute'),
        (v_se_id, 2, 10, w4, FALSE, v_started + (t+4)  * INTERVAL '1 minute'),
        (v_se_id, 3, 10, w4, FALSE, v_started + (t+8)  * INTERVAL '1 minute');
      v_vol := v_vol + 32*w4;
      t := t + 11;

      -- 5. Face pull (3 séries)
      INSERT INTO session_exercises (session_id, exercise_id, order_index, status)
      VALUES (v_sess_id, e_face_pull, 5, 'COMPLETED') RETURNING id INTO v_se_id;
      INSERT INTO session_sets (session_exercise_id, set_number, reps, weight_kg, is_personal_record, completed_at) VALUES
        (v_se_id, 1, 15, w5, FALSE, v_started + t      * INTERVAL '1 minute'),
        (v_se_id, 2, 15, w5, FALSE, v_started + (t+3)  * INTERVAL '1 minute'),
        (v_se_id, 3, 12, w5, FALSE, v_started + (t+6)  * INTERVAL '1 minute');
      v_vol := v_vol + 42*w5;
      t := t + 9;

      -- 6. Rosca direta (3 séries)
      INSERT INTO session_exercises (session_id, exercise_id, order_index, status)
      VALUES (v_sess_id, e_rosca_dir, 6, 'COMPLETED') RETURNING id INTO v_se_id;
      INSERT INTO session_sets (session_exercise_id, set_number, reps, weight_kg, is_personal_record, completed_at) VALUES
        (v_se_id, 1, 12, w6, FALSE, v_started + t      * INTERVAL '1 minute'),
        (v_se_id, 2, 10, w6, FALSE, v_started + (t+3)  * INTERVAL '1 minute'),
        (v_se_id, 3, 10, w6, FALSE, v_started + (t+6)  * INTERVAL '1 minute');
      v_vol := v_vol + 32*w6;
      t := t + 9;

      -- 7. Rosca martelo (3 séries)
      INSERT INTO session_exercises (session_id, exercise_id, order_index, status)
      VALUES (v_sess_id, e_rosca_mart, 7, 'COMPLETED') RETURNING id INTO v_se_id;
      INSERT INTO session_sets (session_exercise_id, set_number, reps, weight_kg, is_personal_record, completed_at) VALUES
        (v_se_id, 1, 15, w7, FALSE, v_started + t      * INTERVAL '1 minute'),
        (v_se_id, 2, 12, w7, FALSE, v_started + (t+3)  * INTERVAL '1 minute'),
        (v_se_id, 3, 12, w7, FALSE, v_started + (t+6)  * INTERVAL '1 minute');
      v_vol := v_vol + 39*w7;

      v_xp := 40 + (FLOOR(v_vol / 500) * 5)::INTEGER;
      UPDATE training_sessions SET total_volume_kg = v_vol, xp_earned = v_xp WHERE id = v_sess_id;

    -- ── LEGS  (Qua=3, Sáb=6) ──────────────────────────────────────────────
    ELSIF dow IN (3, 6) THEN
      w1 := 80  + (wk-1) * 4.0;   -- Agachamento
      w2 := 120 + (wk-1) * 5.0;   -- Leg press
      w3 := 50  + (wk-1) * 2.0;   -- Extensão joelho
      w4 := 45  + (wk-1) * 2.0;   -- Cadeira flexora
      w5 := 60  + (wk-1) * 3.0;   -- Stiff
      w6 := 80  + (wk-1) * 4.0;   -- Hip thrust
      w7 := 80  + (wk-1) * 2.5;   -- Panturrilha

      INSERT INTO training_sessions (user_id, workout_id, status, started_at, finished_at, total_volume_kg, xp_earned)
      VALUES (v_user, v_legs_id, 'COMPLETED', v_started, v_finished, 0, 0)
      RETURNING id INTO v_sess_id;

      v_vol := 0; t := 5;

      -- 1. Agachamento (4 séries)
      INSERT INTO session_exercises (session_id, exercise_id, order_index, status)
      VALUES (v_sess_id, e_agach, 1, 'COMPLETED') RETURNING id INTO v_se_id;
      v_is_pr := (wk IN (3,7) AND dow = 3);
      INSERT INTO session_sets (session_exercise_id, set_number, reps, weight_kg, is_personal_record, completed_at) VALUES
        (v_se_id, 1, 12, ROUND(w1*0.8,1), FALSE,   v_started + t       * INTERVAL '1 minute'),
        (v_se_id, 2, 10, w1,              v_is_pr, v_started + (t+5)  * INTERVAL '1 minute'),
        (v_se_id, 3,  8, w1,              FALSE,   v_started + (t+10) * INTERVAL '1 minute'),
        (v_se_id, 4,  8, w1,              FALSE,   v_started + (t+15) * INTERVAL '1 minute');
      v_vol := v_vol + 12*ROUND(w1*0.8,1) + 26*w1;
      t := t + 19;

      -- 2. Leg press (4 séries)
      INSERT INTO session_exercises (session_id, exercise_id, order_index, status)
      VALUES (v_sess_id, e_leg_press, 2, 'COMPLETED') RETURNING id INTO v_se_id;
      INSERT INTO session_sets (session_exercise_id, set_number, reps, weight_kg, is_personal_record, completed_at) VALUES
        (v_se_id, 1, 12, w2, FALSE, v_started + t       * INTERVAL '1 minute'),
        (v_se_id, 2, 10, w2, FALSE, v_started + (t+4)  * INTERVAL '1 minute'),
        (v_se_id, 3, 10, w2, FALSE, v_started + (t+8)  * INTERVAL '1 minute'),
        (v_se_id, 4,  8, w2, FALSE, v_started + (t+12) * INTERVAL '1 minute');
      v_vol := v_vol + 40*w2;
      t := t + 15;

      -- 3. Extensão de joelho (3 séries)
      INSERT INTO session_exercises (session_id, exercise_id, order_index, status)
      VALUES (v_sess_id, e_ext_joe, 3, 'COMPLETED') RETURNING id INTO v_se_id;
      INSERT INTO session_sets (session_exercise_id, set_number, reps, weight_kg, is_personal_record, completed_at) VALUES
        (v_se_id, 1, 15, w3, FALSE, v_started + t      * INTERVAL '1 minute'),
        (v_se_id, 2, 12, w3, FALSE, v_started + (t+3)  * INTERVAL '1 minute'),
        (v_se_id, 3, 12, w3, FALSE, v_started + (t+6)  * INTERVAL '1 minute');
      v_vol := v_vol + 39*w3;
      t := t + 9;

      -- 4. Cadeira flexora (3 séries)
      INSERT INTO session_exercises (session_id, exercise_id, order_index, status)
      VALUES (v_sess_id, e_cad_flex, 4, 'COMPLETED') RETURNING id INTO v_se_id;
      INSERT INTO session_sets (session_exercise_id, set_number, reps, weight_kg, is_personal_record, completed_at) VALUES
        (v_se_id, 1, 15, w4, FALSE, v_started + t      * INTERVAL '1 minute'),
        (v_se_id, 2, 12, w4, FALSE, v_started + (t+3)  * INTERVAL '1 minute'),
        (v_se_id, 3, 12, w4, FALSE, v_started + (t+6)  * INTERVAL '1 minute');
      v_vol := v_vol + 39*w4;
      t := t + 9;

      -- 5. Stiff (3 séries)
      INSERT INTO session_exercises (session_id, exercise_id, order_index, status)
      VALUES (v_sess_id, e_stiff, 5, 'COMPLETED') RETURNING id INTO v_se_id;
      INSERT INTO session_sets (session_exercise_id, set_number, reps, weight_kg, is_personal_record, completed_at) VALUES
        (v_se_id, 1, 10, w5, FALSE, v_started + t      * INTERVAL '1 minute'),
        (v_se_id, 2, 10, w5, FALSE, v_started + (t+4)  * INTERVAL '1 minute'),
        (v_se_id, 3,  8, w5, FALSE, v_started + (t+8)  * INTERVAL '1 minute');
      v_vol := v_vol + 28*w5;
      t := t + 11;

      -- 6. Hip thrust (3 séries)
      INSERT INTO session_exercises (session_id, exercise_id, order_index, status)
      VALUES (v_sess_id, e_hip_thr, 6, 'COMPLETED') RETURNING id INTO v_se_id;
      INSERT INTO session_sets (session_exercise_id, set_number, reps, weight_kg, is_personal_record, completed_at) VALUES
        (v_se_id, 1, 12, w6, FALSE, v_started + t      * INTERVAL '1 minute'),
        (v_se_id, 2, 10, w6, FALSE, v_started + (t+4)  * INTERVAL '1 minute'),
        (v_se_id, 3, 10, w6, FALSE, v_started + (t+8)  * INTERVAL '1 minute');
      v_vol := v_vol + 32*w6;
      t := t + 11;

      -- 7. Panturrilha (4 séries)
      INSERT INTO session_exercises (session_id, exercise_id, order_index, status)
      VALUES (v_sess_id, e_pantur, 7, 'COMPLETED') RETURNING id INTO v_se_id;
      INSERT INTO session_sets (session_exercise_id, set_number, reps, weight_kg, is_personal_record, completed_at) VALUES
        (v_se_id, 1, 20, w7, FALSE, v_started + t      * INTERVAL '1 minute'),
        (v_se_id, 2, 20, w7, FALSE, v_started + (t+3)  * INTERVAL '1 minute'),
        (v_se_id, 3, 15, w7, FALSE, v_started + (t+6)  * INTERVAL '1 minute'),
        (v_se_id, 4, 15, w7, FALSE, v_started + (t+9)  * INTERVAL '1 minute');
      v_vol := v_vol + 70*w7;

      v_xp := 50 + (FLOOR(v_vol / 500) * 5)::INTEGER;
      UPDATE training_sessions SET total_volume_kg = v_vol, xp_earned = v_xp WHERE id = v_sess_id;

    END IF;
  END LOOP;

  -- ── Atualiza perfil do usuário ─────────────────────────────────────────────
  INSERT INTO user_profiles (user_id, xp, streak, last_workout_date, onboarding_completed)
  VALUES (
    v_user,
    (SELECT COALESCE(SUM(xp_earned), 0) FROM training_sessions WHERE user_id = v_user),
    6,
    '2026-06-13',
    TRUE
  )
  ON CONFLICT (user_id) DO UPDATE
    SET xp                 = (SELECT COALESCE(SUM(xp_earned), 0) FROM training_sessions WHERE user_id = v_user),
        streak             = 6,
        last_workout_date  = '2026-06-13',
        onboarding_completed = TRUE;

END $$;
