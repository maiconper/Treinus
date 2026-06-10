package com.treinus.sessions;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "session_sets")
@Getter
@Setter
@NoArgsConstructor
public class SessionSet {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_exercise_id", nullable = false)
    private SessionExercise sessionExercise;

    @Column(name = "set_number", nullable = false)
    private Integer setNumber;

    @Column(nullable = false)
    private Integer reps;

    @Column(name = "weight_kg", precision = 6, scale = 2, nullable = false)
    private BigDecimal weightKg;

    @Column(name = "completed_at", nullable = false)
    private Instant completedAt;

    @Column(name = "is_personal_record")
    private boolean personalRecord = false;

    @PrePersist
    void prePersist() {
        completedAt = Instant.now();
    }
}
