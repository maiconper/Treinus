package com.treinus.progress;

import com.treinus.exercises.Exercise;
import com.treinus.exercises.ExerciseRepository;
import com.treinus.progress.dto.ExerciseProgressResponse;
import com.treinus.progress.dto.HeatmapDayResponse;
import com.treinus.progress.dto.MuscleSetStatResponse;
import com.treinus.progress.dto.PersonalRecordResponse;
import com.treinus.progress.dto.ProgressSummaryResponse;
import com.treinus.progress.dto.TopExerciseResponse;
import com.treinus.progress.dto.WeeklyVolumeResponse;
import com.treinus.progress.dto.WorkoutHistoryResponse;
import com.treinus.sessions.SessionSet;
import com.treinus.sessions.SessionSetRepository;
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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ProgressService {

    private final TrainingSessionRepository sessionRepository;
    private final SessionSetRepository sessionSetRepository;
    private final UserProfileRepository userProfileRepository;
    private final ExerciseRepository exerciseRepository;

    public ProgressService(TrainingSessionRepository sessionRepository,
                           SessionSetRepository sessionSetRepository,
                           UserProfileRepository userProfileRepository,
                           ExerciseRepository exerciseRepository) {
        this.sessionRepository = sessionRepository;
        this.sessionSetRepository = sessionSetRepository;
        this.userProfileRepository = userProfileRepository;
        this.exerciseRepository = exerciseRepository;
    }

    public ProgressSummaryResponse getSummary(UUID userId, String period) {
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);

        Instant weekStart = Instant.now().atZone(ZoneOffset.UTC)
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                .toLocalDate().atStartOfDay(ZoneOffset.UTC).toInstant();

        Instant lastWeekStart = weekStart.minusSeconds(7 * 24 * 3600);
        Instant lastWeekEnd = weekStart;

        Page<TrainingSession> allCompleted = sessionRepository
                .findByUserIdAndStatusOrderByStartedAtDesc(userId, SessionStatus.COMPLETED, Pageable.unpaged());

        Instant periodFrom = switch (period.toUpperCase()) {
            case "WEEK"  -> Instant.now().minusSeconds(7L * 24 * 3600);
            case "MONTH" -> Instant.now().minusSeconds(30L * 24 * 3600);
            case "YEAR"  -> Instant.now().minusSeconds(365L * 24 * 3600);
            default      -> Instant.EPOCH;
        };

        List<TrainingSession> periodSessions = allCompleted.getContent().stream()
                .filter(s -> s.getStartedAt().isAfter(periodFrom))
                .toList();

        int totalWorkouts = periodSessions.size();

        int workoutsThisWeek = (int) allCompleted.getContent().stream()
                .filter(s -> s.getStartedAt().isAfter(weekStart))
                .count();

        BigDecimal volumeThisWeek = allCompleted.getContent().stream()
                .filter(s -> s.getStartedAt().isAfter(weekStart))
                .filter(s -> s.getTotalVolumeKg() != null)
                .map(TrainingSession::getTotalVolumeKg)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal volumeLastWeek = allCompleted.getContent().stream()
                .filter(s -> s.getStartedAt().isAfter(lastWeekStart) && s.getStartedAt().isBefore(lastWeekEnd))
                .filter(s -> s.getTotalVolumeKg() != null)
                .map(TrainingSession::getTotalVolumeKg)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Integer rawXp = profile != null ? profile.getXp() : null;
        int xp = rawXp != null ? rawXp : 0;
        Integer rawStreak = profile != null ? profile.getStreak() : null;
        int streak = rawStreak != null ? rawStreak : 0;
        int level = XpCalculator.levelFromXp(xp);

        long totalSets = periodSessions.stream()
                .flatMap(s -> s.getExercises().stream())
                .mapToLong(se -> se.getSets().size())
                .sum();

        long totalPersonalRecords = periodSessions.stream()
                .flatMap(s -> s.getExercises().stream())
                .flatMap(se -> se.getSets().stream())
                .filter(SessionSet::isPersonalRecord)
                .count();

        long totalDurationSeconds = periodSessions.stream()
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
                avgDurationSeconds,
                totalPersonalRecords
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

    public List<TopExerciseResponse> getExercisesDone(UUID userId) {
        record ExKey(UUID id, String name) {}

        return sessionRepository
                .findByUserIdAndStatusOrderByStartedAtDesc(userId, SessionStatus.COMPLETED, Pageable.unpaged())
                .getContent().stream()
                .flatMap(s -> s.getExercises().stream())
                .filter(se -> se.getExercise() != null)
                .collect(Collectors.groupingBy(
                        se -> new ExKey(se.getExercise().getId(), se.getExercise().getName()),
                        Collectors.counting()
                ))
                .entrySet().stream()
                .sorted(Map.Entry.<ExKey, Long>comparingByValue().reversed())
                .map(e -> new TopExerciseResponse(
                        e.getKey().id().toString(),
                        e.getKey().name(),
                        e.getValue()
                ))
                .toList();
    }

    public List<TopExerciseResponse> getTopExercises(UUID userId, int limit, String period) {
        record ExKey(UUID id, String name) {}

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
                .filter(se -> se.getExercise() != null)
                .collect(Collectors.groupingBy(
                        se -> new ExKey(se.getExercise().getId(), se.getExercise().getName()),
                        Collectors.counting()
                ))
                .entrySet().stream()
                .sorted(Map.Entry.<ExKey, Long>comparingByValue().reversed())
                .limit(limit)
                .map(e -> new TopExerciseResponse(
                        e.getKey().id().toString(),
                        e.getKey().name(),
                        e.getValue()
                ))
                .toList();
    }

    public List<HeatmapDayResponse> getHeatmap(UUID userId, int months) {
        Instant from = Instant.now().minusSeconds((long) months * 30 * 24 * 3600);
        return sessionRepository
                .findByUserIdAndStatusAndFinishedAtBetween(userId, SessionStatus.COMPLETED, from, Instant.now())
                .stream()
                .filter(s -> s.getStartedAt() != null)
                .collect(Collectors.groupingBy(
                        s -> s.getStartedAt().atZone(ZoneOffset.UTC).toLocalDate().toString(),
                        Collectors.counting()
                ))
                .entrySet().stream()
                .map(e -> new HeatmapDayResponse(e.getKey(), (int) (long) e.getValue()))
                .sorted(Comparator.comparing(HeatmapDayResponse::date))
                .toList();
    }

    public List<PersonalRecordResponse> getPersonalRecords(UUID userId) {
        return sessionSetRepository.findPersonalRecordsByUserId(userId).stream()
                .collect(Collectors.toMap(
                        ss -> ss.getSessionExercise().getExercise().getId(),
                        ss -> ss,
                        (a, b) -> a.getWeightKg().compareTo(b.getWeightKg()) >= 0 ? a : b
                ))
                .values().stream()
                .map(ss -> {
                    Exercise ex = ss.getSessionExercise().getExercise();
                    return new PersonalRecordResponse(
                            ex.getId().toString(),
                            ex.getName(),
                            ex.getCategory() != null ? ex.getCategory().name() : null,
                            ss.getWeightKg().doubleValue(),
                            ss.getReps(),
                            ss.getCompletedAt().atZone(ZoneOffset.UTC).toLocalDate().toString()
                    );
                })
                .sorted(Comparator.comparing(PersonalRecordResponse::achievedAt).reversed())
                .toList();
    }

    public List<WeeklyVolumeResponse> getWeeklyVolume(UUID userId, int weeks) {
        LocalDate todayWeekStart = LocalDate.now(ZoneOffset.UTC)
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate startWeek = todayWeekStart.minusWeeks(weeks - 1);
        Instant from = startWeek.atStartOfDay(ZoneOffset.UTC).toInstant();

        Map<String, Double> volumeByWeek = sessionRepository
                .findByUserIdAndStatusAndFinishedAtBetween(userId, SessionStatus.COMPLETED, from, Instant.now())
                .stream()
                .filter(s -> s.getStartedAt() != null && s.getTotalVolumeKg() != null)
                .collect(Collectors.groupingBy(
                        s -> s.getStartedAt().atZone(ZoneOffset.UTC).toLocalDate()
                                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).toString(),
                        Collectors.summingDouble(s -> s.getTotalVolumeKg().doubleValue())
                ));

        List<WeeklyVolumeResponse> result = new ArrayList<>();
        LocalDate cursor = startWeek;
        while (!cursor.isAfter(todayWeekStart)) {
            String key = cursor.toString();
            result.add(new WeeklyVolumeResponse(key, volumeByWeek.getOrDefault(key, 0.0)));
            cursor = cursor.plusWeeks(1);
        }
        return result;
    }

    public ExerciseProgressResponse getExerciseProgress(UUID userId, UUID exerciseId, String period) {
        Exercise exercise = exerciseRepository.findById(exerciseId)
                .orElseThrow(() -> ResourceNotFoundException.of("Exercise", exerciseId));

        List<TrainingSession> sessions;
        if ("all".equalsIgnoreCase(period)) {
            sessions = sessionRepository
                    .findByUserIdAndStatusOrderByStartedAtDesc(userId, SessionStatus.COMPLETED, Pageable.unpaged())
                    .getContent();
        } else {
            Instant from = switch (period.toUpperCase()) {
                case "1M" -> Instant.now().minusSeconds(30L * 24 * 3600);
                case "3M" -> Instant.now().minusSeconds(90L * 24 * 3600);
                case "6M" -> Instant.now().minusSeconds(180L * 24 * 3600);
                default   -> Instant.EPOCH;
            };
            sessions = sessionRepository
                    .findByUserIdAndStatusAndFinishedAtBetween(userId, SessionStatus.COMPLETED, from, Instant.now());
        }

        List<ExerciseProgressResponse.SetHistoryEntry> history = sessions.stream()
                .flatMap(s -> s.getExercises().stream()
                        .filter(se -> se.getExercise() != null && se.getExercise().getId().equals(exerciseId))
                        .flatMap(se -> se.getSets().stream()
                                .map(set -> new ExerciseProgressResponse.SetHistoryEntry(
                                        s.getId(),
                                        s.getStartedAt(),
                                        set.getCompletedAt(),
                                        set.getReps(),
                                        set.getWeightKg(),
                                        set.isPersonalRecord()
                                ))))
                .toList();

        BigDecimal personalRecord = history.stream()
                .map(ExerciseProgressResponse.SetHistoryEntry::weightKg)
                .filter(w -> w != null)
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);

        return new ExerciseProgressResponse(exerciseId, exercise.getName(), personalRecord, history.size(), history);
    }
}
