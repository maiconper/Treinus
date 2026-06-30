package com.treinus.progress;

import com.treinus.exercises.Exercise;
import com.treinus.exercises.ExerciseRepository;
import com.treinus.progress.dto.ExerciseProgressResponse;
import com.treinus.progress.dto.MuscleSetStatResponse;
import com.treinus.progress.dto.ProgressSummaryResponse;
import com.treinus.progress.dto.WorkoutHistoryResponse;
import com.treinus.sessions.SessionSet;
import com.treinus.sessions.SessionStatus;
import com.treinus.sessions.TrainingSession;
import com.treinus.sessions.TrainingSessionRepository;
import com.treinus.shared.XpCalculator;
import com.treinus.shared.exception.ResourceNotFoundException;
import com.treinus.users.UserProfile;
import com.treinus.users.UserProfileRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ProgressService {

    private final TrainingSessionRepository sessionRepository;
    private final UserProfileRepository userProfileRepository;
    private final ExerciseRepository exerciseRepository;

    public ProgressService(TrainingSessionRepository sessionRepository,
                           UserProfileRepository userProfileRepository,
                           ExerciseRepository exerciseRepository) {
        this.sessionRepository = sessionRepository;
        this.userProfileRepository = userProfileRepository;
        this.exerciseRepository = exerciseRepository;
    }

    public ProgressSummaryResponse getSummary(UUID userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);

        Instant weekStart = Instant.now().atZone(ZoneOffset.UTC)
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                .toLocalDate().atStartOfDay(ZoneOffset.UTC).toInstant();

        Instant lastWeekStart = weekStart.minusSeconds(7 * 24 * 3600);
        Instant lastWeekEnd = weekStart;

        Page<TrainingSession> completedSessions = sessionRepository
                .findByUserIdAndStatusOrderByStartedAtDesc(userId, SessionStatus.COMPLETED, Pageable.unpaged());

        int totalWorkouts = (int) completedSessions.getTotalElements();

        int workoutsThisWeek = (int) completedSessions.getContent().stream()
                .filter(s -> s.getStartedAt().isAfter(weekStart))
                .count();

        BigDecimal volumeThisWeek = completedSessions.getContent().stream()
                .filter(s -> s.getStartedAt().isAfter(weekStart))
                .filter(s -> s.getTotalVolumeKg() != null)
                .map(TrainingSession::getTotalVolumeKg)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal volumeLastWeek = completedSessions.getContent().stream()
                .filter(s -> s.getStartedAt().isAfter(lastWeekStart) && s.getStartedAt().isBefore(lastWeekEnd))
                .filter(s -> s.getTotalVolumeKg() != null)
                .map(TrainingSession::getTotalVolumeKg)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Integer rawXp = profile != null ? profile.getXp() : null;
        int xp = rawXp != null ? rawXp : 0;
        Integer rawStreak = profile != null ? profile.getStreak() : null;
        int streak = rawStreak != null ? rawStreak : 0;
        int level = XpCalculator.levelFromXp(xp);

        long totalSets = sessionRepository.countTotalSetsByUserId(userId);

        long totalDurationSeconds = completedSessions.getContent().stream()
                .filter(s -> s.getStartedAt() != null && s.getFinishedAt() != null)
                .mapToLong(s -> Duration.between(s.getStartedAt(), s.getFinishedAt()).getSeconds())
                .sum();

        long avgDurationSeconds = totalWorkouts > 0 ? totalDurationSeconds / totalWorkouts : 0;

        return new ProgressSummaryResponse(
                xp,
                streak,
                level,
                XpCalculator.xpInCurrentLevel(xp),
                XpCalculator.xpForCurrentLevel(level),
                totalWorkouts,
                workoutsThisWeek,
                volumeThisWeek,
                volumeLastWeek,
                profile != null ? profile.getLastWorkoutDate() : null,
                totalSets,
                totalDurationSeconds,
                avgDurationSeconds
        );
    }

    public Page<WorkoutHistoryResponse> getHistory(UUID userId, Pageable pageable) {
        return sessionRepository
                .findByUserIdAndStatusOrderByStartedAtDesc(userId, SessionStatus.COMPLETED, pageable)
                .map(session -> {
                    int totalSets = session.getExercises().stream()
                            .mapToInt(se -> se.getSets().size())
                            .sum();
                    int newPersonalRecords = (int) session.getExercises().stream()
                            .flatMap(se -> se.getSets().stream())
                            .filter(SessionSet::isPersonalRecord)
                            .count();
                    return WorkoutHistoryResponse.from(session, totalSets, newPersonalRecords);
                });
    }

    public List<WorkoutHistoryResponse> getHistoryForDate(UUID userId, LocalDate date, String zone) {
        ZoneOffset offset = (zone != null && !zone.isBlank()) ? ZoneOffset.of(zone) : ZoneOffset.UTC;
        Instant from = date.atStartOfDay(offset).toInstant();
        Instant to = date.plusDays(1).atStartOfDay(offset).toInstant();
        return sessionRepository
                .findByUserIdAndStatusAndFinishedAtBetween(userId, SessionStatus.COMPLETED, from, to)
                .stream()
                .map(session -> {
                    int totalSets = session.getExercises().stream()
                            .mapToInt(se -> se.getSets().size())
                            .sum();
                    int newPersonalRecords = (int) session.getExercises().stream()
                            .flatMap(se -> se.getSets().stream())
                            .filter(SessionSet::isPersonalRecord)
                            .count();
                    return WorkoutHistoryResponse.from(session, totalSets, newPersonalRecords);
                })
                .toList();
    }

    public List<MuscleSetStatResponse> getSetsByMuscle(UUID userId, String period) {
        List<TrainingSession> sessions;

        if ("ALL".equalsIgnoreCase(period)) {
            sessions = sessionRepository
                    .findByUserIdAndStatusOrderByStartedAtDesc(userId, SessionStatus.COMPLETED, Pageable.unpaged())
                    .getContent();
        } else {
            Instant from = switch (period.toUpperCase()) {
                case "WEEK"  -> Instant.now().minusSeconds(7L * 24 * 3600);
                case "MONTH" -> Instant.now().minusSeconds(30L * 24 * 3600);
                case "YEAR"  -> Instant.now().minusSeconds(365L * 24 * 3600);
                default      -> Instant.EPOCH;
            };
            sessions = sessionRepository
                    .findByUserIdAndStatusAndFinishedAtBetween(userId, SessionStatus.COMPLETED, from, Instant.now());
        }

        return sessions.stream()
                .flatMap(s -> s.getExercises().stream())
                .filter(se -> se.getExercise() != null
                        && se.getExercise().getCategory() != null
                        && !se.getSets().isEmpty())
                .collect(Collectors.groupingBy(
                        se -> se.getExercise().getCategory().name(),
                        Collectors.summingLong(se -> se.getSets().size())
                ))
                .entrySet().stream()
                .map(e -> new MuscleSetStatResponse(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingLong(MuscleSetStatResponse::sets).reversed())
                .toList();
    }

    public ExerciseProgressResponse getExerciseProgress(UUID userId, UUID exerciseId) {
        Exercise exercise = exerciseRepository.findById(exerciseId)
                .orElseThrow(() -> ResourceNotFoundException.of("Exercise", exerciseId));

        Page<TrainingSession> sessions = sessionRepository
                .findByUserIdAndStatusOrderByStartedAtDesc(userId, SessionStatus.COMPLETED, Pageable.unpaged());

        List<ExerciseProgressResponse.SetHistoryEntry> history = sessions.getContent().stream()
                .flatMap(s -> s.getExercises().stream())
                .filter(se -> se.getExercise().getId().equals(exerciseId))
                .flatMap(se -> se.getSets().stream()
                        .map(set -> new ExerciseProgressResponse.SetHistoryEntry(
                                set.getCompletedAt(),
                                set.getReps(),
                                set.getWeightKg(),
                                set.isPersonalRecord()
                        )))
                .toList();

        BigDecimal personalRecord = history.stream()
                .map(ExerciseProgressResponse.SetHistoryEntry::weightKg)
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);

        int totalSets = history.size();

        return new ExerciseProgressResponse(exerciseId, exercise.getName(), personalRecord, totalSets, history);
    }
}
