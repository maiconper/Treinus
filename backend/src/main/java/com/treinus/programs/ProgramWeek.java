package com.treinus.programs;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "program_weeks")
@Getter
@Setter
@NoArgsConstructor
public class ProgramWeek {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "program_id", nullable = false)
    private Program program;

    @Column(name = "week_number", nullable = false)
    private Integer weekNumber;

    @Column(length = 100)
    private String name;

    @OneToMany(mappedBy = "programWeek", cascade = CascadeType.ALL, orphanRemoval = true,
               fetch = FetchType.LAZY)
    @OrderBy("dayOfWeek ASC")
    private List<ProgramDay> days = new ArrayList<>();
}
