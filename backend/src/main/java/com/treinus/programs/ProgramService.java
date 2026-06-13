package com.treinus.programs;

import com.treinus.programs.dto.*;
import com.treinus.shared.exception.BusinessException;
import com.treinus.shared.exception.ResourceNotFoundException;
import com.treinus.users.User;
import com.treinus.users.UserRepository;
import com.treinus.users.UserRole;
import com.treinus.workouts.Workout;
import com.treinus.workouts.WorkoutRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ProgramService {

    private final ProgramRepository programRepository;
    private final ProgramWeekRepository programWeekRepository;
    private final ProgramDayRepository programDayRepository;
    private final UserRepository userRepository;
    private final WorkoutRepository workoutRepository;

    public ProgramService(ProgramRepository programRepository,
                          ProgramWeekRepository programWeekRepository,
                          ProgramDayRepository programDayRepository,
                          UserRepository userRepository,
                          WorkoutRepository workoutRepository) {
        this.programRepository = programRepository;
        this.programWeekRepository = programWeekRepository;
        this.programDayRepository = programDayRepository;
        this.userRepository = userRepository;
        this.workoutRepository = workoutRepository;
    }

    public List<ProgramResponse> findAllByUser(UUID userId) {
        return programRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(ProgramResponse::from)
                .toList();
    }

    public ProgramResponse findById(UUID id, UUID userId) {
        return ProgramResponse.from(findProgram(id, userId));
    }

    public Optional<ProgramResponse> findActive(UUID userId) {
        return programRepository.findByUserIdAndStatus(userId, ProgramStatus.ACTIVE)
                .map(ProgramResponse::from);
    }

    @Transactional
    public ProgramResponse create(CreateProgramRequest request, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("User", userId));

        Program program = new Program();
        program.setName(request.name());
        program.setDescription(request.description());
        program.setWeeksCount(request.weeksCount());
        program.setUser(user);
        program.setStatus(ProgramStatus.DRAFT);
        programRepository.save(program);

        int weeks = request.weeksCount() != null ? request.weeksCount() : 0;
        for (int i = 1; i <= weeks; i++) {
            ProgramWeek week = new ProgramWeek();
            week.setProgram(program);
            week.setWeekNumber(i);
            program.getWeeks().add(week);
        }

        return ProgramResponse.from(programRepository.save(program));
    }

    @Transactional
    public ProgramResponse start(UUID id, UUID userId) {
        Program program = findProgram(id, userId);

        if (program.getStatus() == ProgramStatus.ACTIVE) {
            throw new BusinessException("Program is already active");
        }
        if (program.getStatus() == ProgramStatus.COMPLETED || program.getStatus() == ProgramStatus.CANCELLED) {
            throw new BusinessException("Cannot start a " + program.getStatus().name().toLowerCase() + " program");
        }

        // Cancel current active program if any
        programRepository.findByUserIdAndStatus(userId, ProgramStatus.ACTIVE).ifPresent(active -> {
            active.setStatus(ProgramStatus.CANCELLED);
            active.setEndedAt(Instant.now());
            programRepository.save(active);
        });

        program.setStatus(ProgramStatus.ACTIVE);
        program.setStartedAt(Instant.now());
        return ProgramResponse.from(programRepository.save(program));
    }

    @Transactional
    public ProgramResponse finish(UUID id, UUID userId) {
        Program program = findProgram(id, userId);

        if (program.getStatus() != ProgramStatus.ACTIVE) {
            throw new BusinessException("Program is not active");
        }

        program.setStatus(ProgramStatus.COMPLETED);
        program.setEndedAt(Instant.now());
        return ProgramResponse.from(programRepository.save(program));
    }

    @Transactional
    public ProgramResponse addWeek(UUID programId, CreateProgramWeekRequest request, UUID userId) {
        Program program = findProgram(programId, userId);

        boolean weekExists = program.getWeeks().stream()
                .anyMatch(w -> w.getWeekNumber().equals(request.weekNumber()));
        if (weekExists) {
            throw new BusinessException("Week " + request.weekNumber() + " already exists in this program");
        }

        ProgramWeek week = new ProgramWeek();
        week.setProgram(program);
        week.setWeekNumber(request.weekNumber());
        week.setName(request.name());

        program.getWeeks().add(week);
        return ProgramResponse.from(programRepository.save(program));
    }

    @Transactional
    public ProgramResponse addDay(UUID programId, UUID weekId, CreateProgramDayRequest request, UUID userId) {
        findProgram(programId, userId);
        ProgramWeek week = programWeekRepository.findByIdAndProgramId(weekId, programId)
                .orElseThrow(() -> ResourceNotFoundException.of("ProgramWeek", weekId));

        boolean dayExists = week.getDays().stream()
                .anyMatch(d -> d.getDayOfWeek().equals(request.dayOfWeek()));
        if (dayExists) {
            throw new BusinessException("Day of week " + request.dayOfWeek() + " already configured in this week");
        }

        Workout workout = null;
        if (!request.restDay() && request.workoutId() != null) {
            workout = workoutRepository.findByIdAndUserId(request.workoutId(), userId)
                    .or(() -> workoutRepository.findByIdAndUserRole(request.workoutId(), UserRole.SYSTEM))
                    .orElseThrow(() -> ResourceNotFoundException.of("Workout", request.workoutId()));
        }

        ProgramDay day = new ProgramDay();
        day.setProgramWeek(week);
        day.setDayOfWeek(request.dayOfWeek());
        day.setWorkout(workout);
        day.setRestDay(request.restDay());

        week.getDays().add(day);
        programWeekRepository.save(week);

        return ProgramResponse.from(programRepository.findById(programId)
                .orElseThrow(() -> ResourceNotFoundException.of("Program", programId)));
    }

    @Transactional
    public ProgramResponse update(UUID id, UpdateProgramRequest request, UUID userId) {
        Program program = findProgram(id, userId);
        program.setName(request.name());
        if (request.description() != null) {
            program.setDescription(request.description());
        }
        return ProgramResponse.from(programRepository.save(program));
    }

    @Transactional
    public void delete(UUID id, UUID userId) {
        Program program = findProgram(id, userId);
        if (program.getStatus() == ProgramStatus.ACTIVE) {
            throw new BusinessException("Cannot delete an active program");
        }
        programRepository.delete(program);
    }

    @Transactional
    public ProgramResponse removeWeek(UUID programId, UUID weekId, UUID userId) {
        findProgram(programId, userId);
        ProgramWeek week = programWeekRepository.findByIdAndProgramId(weekId, programId)
                .orElseThrow(() -> ResourceNotFoundException.of("ProgramWeek", weekId));
        programWeekRepository.delete(week);
        return ProgramResponse.from(programRepository.findById(programId)
                .orElseThrow(() -> ResourceNotFoundException.of("Program", programId)));
    }

    @Transactional
    public ProgramResponse removeDay(UUID programId, UUID weekId, UUID dayId, UUID userId) {
        findProgram(programId, userId);
        programWeekRepository.findByIdAndProgramId(weekId, programId)
                .orElseThrow(() -> ResourceNotFoundException.of("ProgramWeek", weekId));
        ProgramDay day = programDayRepository.findByIdAndProgramWeekId(dayId, weekId)
                .orElseThrow(() -> ResourceNotFoundException.of("ProgramDay", dayId));
        programDayRepository.delete(day);
        return ProgramResponse.from(programRepository.findById(programId)
                .orElseThrow(() -> ResourceNotFoundException.of("Program", programId)));
    }

    @Transactional
    public ProgramResponse updateDay(UUID programId, UUID weekId, UUID dayId,
                                     UpdateProgramDayRequest request, UUID userId) {
        findProgram(programId, userId);
        programWeekRepository.findByIdAndProgramId(weekId, programId)
                .orElseThrow(() -> ResourceNotFoundException.of("ProgramWeek", weekId));
        ProgramDay day = programDayRepository.findByIdAndProgramWeekId(dayId, weekId)
                .orElseThrow(() -> ResourceNotFoundException.of("ProgramDay", dayId));

        if (request.restDay()) {
            day.setRestDay(true);
            day.setWorkout(null);
        } else if (request.workoutId() != null) {
            Workout workout = workoutRepository.findByIdAndUserId(request.workoutId(), userId)
                    .or(() -> workoutRepository.findByIdAndUserRole(request.workoutId(), UserRole.SYSTEM))
                    .orElseThrow(() -> ResourceNotFoundException.of("Workout", request.workoutId()));
            day.setRestDay(false);
            day.setWorkout(workout);
        }

        programDayRepository.save(day);
        return ProgramResponse.from(programRepository.findById(programId)
                .orElseThrow(() -> ResourceNotFoundException.of("Program", programId)));
    }

    private Program findProgram(UUID id, UUID userId) {
        return programRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> ResourceNotFoundException.of("Program", id));
    }
}
