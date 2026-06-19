ALTER TABLE workout_exercises
    DROP CONSTRAINT workout_exercises_workout_id_order_index_key;

ALTER TABLE workout_exercises
    ADD CONSTRAINT workout_exercises_workout_id_order_index_key
        UNIQUE (workout_id, order_index) DEFERRABLE INITIALLY DEFERRED;
