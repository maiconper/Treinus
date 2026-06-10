package com.treinus.users;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "user_profiles")
@Getter
@Setter
@NoArgsConstructor
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "fitness_level", length = 20)
    private FitnessLevel fitnessLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "goal", length = 30)
    private FitnessGoal goal;

    @Column(name = "available_days_per_week")
    private Integer availableDaysPerWeek;

    @Column(name = "body_weight_kg", precision = 5, scale = 2)
    private BigDecimal bodyWeightKg;

    @Column(name = "height_cm")
    private Integer heightCm;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(nullable = false)
    private Integer xp = 0;

    @Column(nullable = false)
    private Integer streak = 0;

    @Column(name = "last_workout_date")
    private LocalDate lastWorkoutDate;

    @Column(name = "onboarding_completed", nullable = false)
    private Boolean onboardingCompleted = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }
}
