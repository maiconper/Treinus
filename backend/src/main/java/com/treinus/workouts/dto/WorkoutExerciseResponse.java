package com.treinus.workouts.dto;

import com.treinus.exercises.Equipment;
import com.treinus.exercises.ExerciseCategory;
import com.treinus.workouts.WorkoutExercise;

import java.math.BigDecimal;
import java.util.UUID;

public record WorkoutExerciseResponse(
        UUID id,
        UUID exerciseId,
        String exerciseName,
        ExerciseCategory category,
        Equipment equipment,
        int orderIndex,
        int plannedSets,
        Integer plannedRepsMin,
        Integer plannedRepsMax,
        BigDecimal plannedWeightKg,
        int restSeconds,
        String notes
) {
    public static WorkoutExerciseResponse from(WorkoutExercise we) {
        return new WorkoutExerciseResponse(
                we.getId(),
                we.getExercise().getId(),
                we.getExercise().getName(),
                we.getExercise().getCategory(),
                we.getExercise().getEquipment(),
                we.getOrderIndex(),
                we.getPlannedSets(),
                we.getPlannedRepsMin(),
                we.getPlannedRepsMax(),
                we.getPlannedWeightKg(),
                we.getRestSeconds() != null ? we.getRestSeconds() : 60,
                we.getNotes()
        );
    }
}
