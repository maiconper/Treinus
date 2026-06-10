package com.treinus.sessions;

import com.treinus.exercises.Exercise;
import com.treinus.workouts.WorkoutExercise;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "session_exercises")
@Getter
@Setter
@NoArgsConstructor
public class SessionExercise {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private TrainingSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_id", nullable = false)
    private Exercise exercise;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workout_exercise_id")
    private WorkoutExercise workoutExercise;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SessionExerciseStatus status = SessionExerciseStatus.PENDING;

    @Column(name = "skip_reason", columnDefinition = "TEXT")
    private String skipReason;

    @OneToMany(mappedBy = "sessionExercise", cascade = CascadeType.ALL, orphanRemoval = true,
               fetch = FetchType.LAZY)
    @OrderBy("setNumber ASC")
    private List<SessionSet> sets = new ArrayList<>();
}
