-- Seed: programa PPL 10 semanas para teste@gmail.com
-- Seg/Qui = Push | Ter/Sex = Pull | Qua/Sáb = Legs | Dom = Descanso

DO $$
DECLARE
  v_user    UUID;
  v_push_id UUID;
  v_pull_id UUID;
  v_legs_id UUID;
  v_prog_id UUID;
  v_week_id UUID;
  wk        INTEGER;
  d         INTEGER;
  now_ts    TIMESTAMPTZ := NOW();
BEGIN
  SELECT id INTO v_user FROM users WHERE email = 'teste@gmail.com';
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Usuário teste@gmail.com não encontrado';
  END IF;

  IF EXISTS (SELECT 1 FROM programs WHERE user_id = v_user LIMIT 1) THEN
    RAISE NOTICE 'Programa já existe para teste@gmail.com — pulando.';
    RETURN;
  END IF;

  SELECT w.id INTO v_push_id FROM workouts w JOIN users u ON w.user_id = u.id
   WHERE w.name = 'Push — Peito, Ombros e Tríceps' AND u.email = 'system@treinus.app';

  SELECT w.id INTO v_pull_id FROM workouts w JOIN users u ON w.user_id = u.id
   WHERE w.name = 'Pull — Costas e Bíceps' AND u.email = 'system@treinus.app';

  SELECT w.id INTO v_legs_id FROM workouts w JOIN users u ON w.user_id = u.id
   WHERE w.name = 'Legs — Pernas e Glúteos' AND u.email = 'system@treinus.app';

  INSERT INTO programs (name, description, user_id, weeks_count, status, started_at, created_at, updated_at)
  VALUES (
    'PPL — 10 Semanas',
    'Programa Push Pull Legs de 10 semanas com foco em hipertrofia e progressão de carga. 6 treinos por semana com descanso aos domingos.',
    v_user,
    10,
    'ACTIVE',
    '2026-04-15 07:00:00+00',
    now_ts,
    now_ts
  )
  RETURNING id INTO v_prog_id;

  FOR wk IN 1..10 LOOP
    INSERT INTO program_weeks (program_id, week_number, name)
    VALUES (v_prog_id, wk, 'Semana ' || wk)
    RETURNING id INTO v_week_id;

    -- 1=Seg 2=Ter 3=Qua 4=Qui 5=Sex 6=Sáb 7=Dom
    FOR d IN 1..7 LOOP
      IF d = 7 THEN
        INSERT INTO program_days (program_week_id, day_of_week, workout_id, is_rest_day)
        VALUES (v_week_id, d, NULL, TRUE);
      ELSIF d IN (1, 4) THEN
        INSERT INTO program_days (program_week_id, day_of_week, workout_id, is_rest_day)
        VALUES (v_week_id, d, v_push_id, FALSE);
      ELSIF d IN (2, 5) THEN
        INSERT INTO program_days (program_week_id, day_of_week, workout_id, is_rest_day)
        VALUES (v_week_id, d, v_pull_id, FALSE);
      ELSE
        INSERT INTO program_days (program_week_id, day_of_week, workout_id, is_rest_day)
        VALUES (v_week_id, d, v_legs_id, FALSE);
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Programa PPL 10 semanas criado: %', v_prog_id;
END $$;
