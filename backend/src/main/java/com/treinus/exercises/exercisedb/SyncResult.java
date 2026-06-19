package com.treinus.exercises.exercisedb;

import java.util.List;

public record SyncResult(
        int updated,
        int skipped,
        int notFound,
        List<String> notFoundExercises
) {}
