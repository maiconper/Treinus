package com.treinus.programs;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProgramWeekRepository extends JpaRepository<ProgramWeek, UUID> {

    Optional<ProgramWeek> findByIdAndProgramId(UUID id, UUID programId);
}
