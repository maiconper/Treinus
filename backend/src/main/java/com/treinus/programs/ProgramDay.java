package com.treinus.programs;

import com.treinus.workouts.Workout;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "program_days")
@Getter
@Setter
@NoArgsConstructor
public class ProgramDay {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "program_week_id", nullable = false)
    private ProgramWeek programWeek;

    /** 1 = Monday, 7 = Sunday */
    @Column(name = "day_of_week", nullable = false)
    private Integer dayOfWeek;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workout_id")
    private Workout workout;

    @Column(name = "is_rest_day", nullable = false)
    private boolean restDay = false;
}
