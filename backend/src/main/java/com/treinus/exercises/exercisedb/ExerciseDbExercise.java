package com.treinus.exercises.exercisedb;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ExerciseDbExercise(
        String id,
        String name,
        String bodyPart,
        String equipment,
        String gifUrl,
        String target
) {}
