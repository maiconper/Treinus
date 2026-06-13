package com.treinus.programs;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProgramDayRepository extends JpaRepository<ProgramDay, UUID> {

    Optional<ProgramDay> findByIdAndProgramWeekId(UUID id, UUID programWeekId);
}
