package com.treinus.sessions;

import com.treinus.exercises.Exercise;
import com.treinus.exercises.ExerciseRepository;
import com.treinus.programs.ProgramDay;
import com.treinus.programs.ProgramDayRepository;
import com.treinus.sessions.dto.*;
import com.treinus.shared.exception.BusinessException;
import com.treinus.shared.exception.ResourceNotFoundException;
import com.treinus.users.User;
import com.treinus.users.UserProfile;
import com.treinus.users.UserProfileRepository;
import com.treinus.users.UserRepository;
import com.treinus.users.UserRole;
import com.treinus.workouts.Workout;
import com.treinus.workouts.WorkoutExercise;
import com.treinus.workouts.WorkoutRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class SessionService {

    private final TrainingSessionRepository sessionRepository;
    private final SessionExerciseRepository sessionExerciseRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final WorkoutRepository workoutRepository;
    private final ProgramDayRepository programDayRepository;
    private final ExerciseRepository exerciseRepository;

    public SessionService(TrainingSessionRepository sessionRepository,
            SessionExerciseRepository sessionExerciseRepository,
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            WorkoutRepository workoutRepository,
            ProgramDayRepository programDayRepository,
            ExerciseRepository exerciseRepository) {
        this.sessionRepository = sessionRepository;
        this.sessionExerciseRepository = sessionExerciseRepository;
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.workoutRepository = workoutRepository;
        this.programDayRepository = programDayRepository;
        this.exerciseRepository = exerciseRepository;
    }

    public SessionResponse getCurrent(UUID userId) {
        return sessionRepository.findByUserIdAndStatus(userId, SessionStatus.IN_PROGRESS)
                .map(SessionResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("No active session"));
    }

    public SessionResponse getById(UUID id, UUID userId) {
        TrainingSession session = findSession(id, userId);
        return SessionResponse.from(session);
    }

    @Transactional
    public SessionResponse start(StartSessionRequest request, UUID userId) {
        if (sessionRepository.findByUserIdAndStatus(userId, SessionStatus.IN_PROGRESS).isPresent()) {
            throw new BusinessException("You already have an active training session");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("User", userId));

        TrainingSession session = new TrainingSession();
        session.setUser(user);
        session.setNotes(request.notes());

        if (request.workoutId() != null) {
            Workout workout = workoutRepository.findByIdAndUserId(request.workoutId(), userId)
                    .or(() -> workoutRepository.findByIdAndUserRole(request.workoutId(), UserRole.SYSTEM))
                    .orElseThrow(() -> ResourceNotFoundException.of("Workout", request.workoutId()));
            session.setWorkout(workout);

            int index = 0;
            for (WorkoutExercise we : workout.getExercises()) {
                SessionExercise se = new SessionExercise();
                se.setSession(session);
                se.setExercise(we.getExercise());
                se.setWorkoutExercise(we);
                se.setOrderIndex(index++);
                se.setStatus(SessionExerciseStatus.PENDING);
                session.getExercises().add(se);
            }
        }

        if (request.programDayId() != null) {
            ProgramDay programDay = programDayRepository.findById(request.programDayId())
                    .orElseThrow(() -> ResourceNotFoundException.of("ProgramDay", request.programDayId()));
            session.setProgramDay(programDay);

            if (programDay.getWorkout() != null && request.workoutId() == null) {
                session.setWorkout(programDay.getWorkout());
                int index = 0;
                for (WorkoutExercise we : programDay.getWorkout().getExercises()) {
                    SessionExercise se = new SessionExercise();
                    se.setSession(session);
                    se.setExercise(we.getExercise());
                    se.setWorkoutExercise(we);
                    se.setOrderIndex(index++);
                    se.setStatus(SessionExerciseStatus.PENDING);
                    session.getExercises().add(se);
                }
            }
        }

        return SessionResponse.from(sessionRepository.save(session));
    }

    @Transactional
    public SessionResponse registerManual(ManualSessionRequest request, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("User", userId));

        TrainingSession session = new TrainingSession();
        session.setUser(user);

        Instant startedAt = request.date().atTime(12, 0).toInstant(ZoneOffset.UTC);
        session.setStartedAt(startedAt);
        session.setFinishedAt(startedAt.plusSeconds(3600));
        session.setStatus(SessionStatus.COMPLETED);

        if (request.programDayId() != null) {
            ProgramDay programDay = programDayRepository.findById(request.programDayId())
                    .orElseThrow(() -> ResourceNotFoundException.of("ProgramDay", request.programDayId()));
            session.setProgramDay(programDay);
            if (programDay.getWorkout() != null && request.workoutId() == null) {
                session.setWorkout(programDay.getWorkout());
            }
        }

        if (request.workoutId() != null) {
            Workout workout = workoutRepository.findByIdAndUserId(request.workoutId(), userId)
                    .or(() -> workoutRepository.findByIdAndUserRole(request.workoutId(), UserRole.SYSTEM))
                    .orElseThrow(() -> ResourceNotFoundException.of("Workout", request.workoutId()));
            session.setWorkout(workout);
        }

        String resolvedName = (request.name() != null && !request.name().isBlank())
                ? request.name()
                : (session.getWorkout() != null ? session.getWorkout().getName() : "Treino");
        session.setName(resolvedName);

        BigDecimal totalVolume = BigDecimal.ZERO;

        if (request.exercises() != null && !request.exercises().isEmpty()) {
            int exIndex = 0;
            for (ManualExerciseEntry entry : request.exercises()) {
                Exercise exercise = exerciseRepository.findById(entry.exerciseId())
                        .orElseThrow(() -> ResourceNotFoundException.of("Exercise", entry.exerciseId()));

                SessionExercise se = new SessionExercise();
                se.setSession(session);
                se.setExercise(exercise);
                se.setOrderIndex(exIndex++);
                se.setStatus(SessionExerciseStatus.COMPLETED);

                if (!entry.sets().isEmpty()) {
                    int setNumber = 1;
                    for (ManualSetEntry setEntry : entry.sets()) {
                        boolean isPR = sessionExerciseRepository
                                .findPersonalRecord(exercise.getId(), userId)
                                .map(pr -> setEntry.weightKg().compareTo(pr) > 0)
                                .orElse(true);

                        SessionSet set = new SessionSet();
                        set.setSessionExercise(se);
                        set.setSetNumber(setNumber++);
                        set.setReps(setEntry.reps());
                        set.setWeightKg(setEntry.weightKg());
                        set.setPersonalRecord(isPR);
                        se.getSets().add(set);

                        totalVolume = totalVolume.add(
                                setEntry.weightKg().multiply(BigDecimal.valueOf(setEntry.reps())));
                    }
                }
                session.getExercises().add(se);
            }
        }

        session.setTotalVolumeKg(totalVolume);
        session.setXpEarned(0);

        updateUserProgress(userId);

        return SessionResponse.from(sessionRepository.save(session));
    }

    @Transactional
    public SessionResponse recordSet(UUID sessionId, UUID sessionExerciseId,
            RecordSetRequest request, UUID userId) {
        findActiveSession(sessionId, userId);
        SessionExercise se = sessionExerciseRepository.findByIdAndSessionId(sessionExerciseId, sessionId)
                .orElseThrow(() -> ResourceNotFoundException.of("SessionExercise", sessionExerciseId));

        if (se.getStatus() == SessionExerciseStatus.SKIPPED) {
            throw new BusinessException("Cannot record set for a skipped exercise");
        }

        int nextSetNumber = se.getSets().size() + 1;

        // Check for personal record
        boolean isPR = sessionExerciseRepository
                .findPersonalRecord(se.getExercise().getId(), userId)
                .map(pr -> request.weightKg().compareTo(pr) > 0)
                .orElse(true);

        SessionSet set = new SessionSet();
        set.setSessionExercise(se);
        set.setSetNumber(nextSetNumber);
        set.setReps(request.reps());
        set.setWeightKg(request.weightKg());
        set.setPersonalRecord(isPR);

        se.getSets().add(set);
        se.setStatus(SessionExerciseStatus.IN_PROGRESS);
        sessionExerciseRepository.save(se);

        return SessionResponse.from(sessionRepository.findById(sessionId)
                .orElseThrow(() -> ResourceNotFoundException.of("TrainingSession", sessionId)));
    }

    @Transactional
    public SessionResponse completeExercise(UUID sessionId, UUID sessionExerciseId, UUID userId) {
        findActiveSession(sessionId, userId);
        SessionExercise se = sessionExerciseRepository.findByIdAndSessionId(sessionExerciseId, sessionId)
                .orElseThrow(() -> ResourceNotFoundException.of("SessionExercise", sessionExerciseId));

        if (se.getStatus() == SessionExerciseStatus.SKIPPED) {
            throw new BusinessException("Cannot complete a skipped exercise");
        }
        if (se.getStatus() == SessionExerciseStatus.COMPLETED) {
            throw new BusinessException("Exercise is already completed");
        }

        se.setStatus(SessionExerciseStatus.COMPLETED);
        sessionExerciseRepository.save(se);

        return SessionResponse.from(sessionRepository.findById(sessionId)
                .orElseThrow(() -> ResourceNotFoundException.of("TrainingSession", sessionId)));
    }

    @Transactional
    public SessionResponse skipExercise(UUID sessionId, UUID sessionExerciseId,
            SkipExerciseRequest request, UUID userId) {
        findActiveSession(sessionId, userId);
        SessionExercise se = sessionExerciseRepository.findByIdAndSessionId(sessionExerciseId, sessionId)
                .orElseThrow(() -> ResourceNotFoundException.of("SessionExercise", sessionExerciseId));

        if (se.getStatus() == SessionExerciseStatus.COMPLETED) {
            throw new BusinessException("Cannot skip an already completed exercise");
        }

        se.setStatus(SessionExerciseStatus.SKIPPED);
        se.setSkipReason(request.reason());
        sessionExerciseRepository.save(se);

        return SessionResponse.from(sessionRepository.findById(sessionId)
                .orElseThrow(() -> ResourceNotFoundException.of("TrainingSession", sessionId)));
    }

    @Transactional
    public SessionSummaryResponse finish(UUID sessionId, UUID userId) {
        TrainingSession session = findActiveSession(sessionId, userId);

        // Mark remaining PENDING/IN_PROGRESS exercises as completed
        session.getExercises().stream()
                .filter(se -> se.getStatus() == SessionExerciseStatus.IN_PROGRESS
                        || se.getStatus() == SessionExerciseStatus.PENDING)
                .forEach(se -> {
                    if (!se.getSets().isEmpty()) {
                        se.setStatus(SessionExerciseStatus.COMPLETED);
                    }
                });

        // Calculate totals
        int totalSets = 0;
        int totalReps = 0;
        BigDecimal totalVolume = BigDecimal.ZERO;
        int newPRs = 0;

        for (SessionExercise se : session.getExercises()) {
            for (SessionSet set : se.getSets()) {
                totalSets++;
                totalReps += set.getReps();
                totalVolume = totalVolume.add(
                        set.getWeightKg().multiply(BigDecimal.valueOf(set.getReps())));
                if (set.isPersonalRecord())
                    newPRs++;
            }
        }

        session.setStatus(SessionStatus.COMPLETED);
        session.setFinishedAt(Instant.now());
        session.setTotalVolumeKg(totalVolume);
        // XP calculation: TODO — implement formula
        session.setXpEarned(0);

        sessionRepository.save(session);

        // Update user profile streak and last workout date
        updateUserProgress(userId);

        long durationSeconds = Duration.between(session.getStartedAt(), session.getFinishedAt()).getSeconds();

        List<SessionExerciseResponse> exercises = session.getExercises().stream()
                .map(SessionExerciseResponse::from)
                .toList();

        return new SessionSummaryResponse(
                session.getId(),
                session.getWorkout() != null ? session.getWorkout().getName() : "Free Session",
                durationSeconds,
                totalSets,
                totalReps,
                totalVolume,
                session.getXpEarned(),
                newPRs,
                exercises);
    }

    @Transactional
    public void abandon(UUID sessionId, UUID userId) {
        TrainingSession session = findActiveSession(sessionId, userId);
        session.setStatus(SessionStatus.ABANDONED);
        session.setFinishedAt(Instant.now());
        sessionRepository.save(session);
    }

    private void updateUserProgress(UUID userId) {
        userProfileRepository.findByUserId(userId).ifPresent(profile -> {
            LocalDate today = LocalDate.now();
            LocalDate lastWorkout = profile.getLastWorkoutDate();

            if (lastWorkout == null || lastWorkout.isBefore(today.minusDays(1))) {
                // Streak broken
                profile.setStreak(1);
            } else if (lastWorkout.equals(today.minusDays(1))) {
                // Consecutive day
                profile.setStreak(profile.getStreak() + 1);
            }
            // If same day, streak stays the same

            profile.setLastWorkoutDate(today);
            userProfileRepository.save(profile);
        });
    }

    private TrainingSession findActiveSession(UUID sessionId, UUID userId) {
        TrainingSession session = findSession(sessionId, userId);
        if (session.getStatus() != SessionStatus.IN_PROGRESS) {
            throw new BusinessException("Session is not in progress");
        }
        return session;
    }

    private TrainingSession findSession(UUID id, UUID userId) {
        return sessionRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> ResourceNotFoundException.of("TrainingSession", id));
    }
}
