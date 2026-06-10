package com.treinus.sessions;

import com.treinus.programs.ProgramDay;
import com.treinus.users.User;
import com.treinus.workouts.Workout;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "training_sessions")
@Getter
@Setter
@NoArgsConstructor
public class TrainingSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workout_id")
    private Workout workout;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "program_day_id")
    private ProgramDay programDay;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SessionStatus status = SessionStatus.IN_PROGRESS;

    @Column(name = "started_at", nullable = false, updatable = false)
    private Instant startedAt;

    @Column(name = "finished_at")
    private Instant finishedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "total_volume_kg", precision = 10, scale = 2)
    private BigDecimal totalVolumeKg;

    @Column(name = "xp_earned")
    private Integer xpEarned = 0;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true,
               fetch = FetchType.LAZY)
    @OrderBy("orderIndex ASC")
    private List<SessionExercise> exercises = new ArrayList<>();

    @PrePersist
    void prePersist() {
        startedAt = Instant.now();
    }
}
