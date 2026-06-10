package com.treinus.workouts;

import com.treinus.exercises.Exercise;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "workout_exercises")
@Getter
@Setter
@NoArgsConstructor
public class WorkoutExercise {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workout_id", nullable = false)
    private Workout workout;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_id", nullable = false)
    private Exercise exercise;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    @Column(name = "planned_sets", nullable = false)
    private Integer plannedSets = 3;

    @Column(name = "planned_reps_min")
    private Integer plannedRepsMin;

    @Column(name = "planned_reps_max")
    private Integer plannedRepsMax;

    @Column(name = "planned_weight_kg", precision = 6, scale = 2)
    private BigDecimal plannedWeightKg;

    @Column(name = "rest_seconds")
    private Integer restSeconds = 60;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
