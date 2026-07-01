package com.treinus.achievements;

import com.treinus.achievements.dto.AchievementResponse;
import com.treinus.exercises.ExerciseCategory;
import com.treinus.programs.Program;
import com.treinus.programs.ProgramDay;
import com.treinus.programs.ProgramRepository;
import com.treinus.programs.ProgramStatus;
import com.treinus.sessions.SessionSet;
import com.treinus.sessions.SessionSetRepository;
import com.treinus.sessions.SessionStatus;
import com.treinus.sessions.TrainingSession;
import com.treinus.sessions.TrainingSessionRepository;
import com.treinus.users.UserRepository;
import com.treinus.workouts.WorkoutRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.MonthDay;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.time.temporal.IsoFields;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AchievementService {

    private static final ZoneId ZONE = ZoneId.systemDefault();

    private static final Set<MonthDay> FIXED_HOLIDAYS = Set.of(
            MonthDay.of(1, 1), MonthDay.of(4, 21), MonthDay.of(5, 1), MonthDay.of(9, 7),
            MonthDay.of(10, 12), MonthDay.of(11, 2), MonthDay.of(11, 15), MonthDay.of(12, 25));

    private final UserAchievementRepository userAchievementRepository;
    private final TrainingSessionRepository sessionRepository;
    private final SessionSetRepository sessionSetRepository;
    private final ProgramRepository programRepository;
    private final WorkoutRepository workoutRepository;
    private final UserRepository userRepository;

    public AchievementService(UserAchievementRepository userAchievementRepository,
            TrainingSessionRepository sessionRepository,
            SessionSetRepository sessionSetRepository,
            ProgramRepository programRepository,
            WorkoutRepository workoutRepository,
            UserRepository userRepository) {
        this.userAchievementRepository = userAchievementRepository;
        this.sessionRepository = sessionRepository;
        this.sessionSetRepository = sessionSetRepository;
        this.programRepository = programRepository;
        this.workoutRepository = workoutRepository;
        this.userRepository = userRepository;
    }

    public List<AchievementResponse> getAll(UUID userId) {
        evaluate(userId);

        Map<String, UserAchievement> unlocked = userAchievementRepository.findByUserId(userId).stream()
                .collect(Collectors.toMap(UserAchievement::getCode, ua -> ua));

        return AchievementCatalog.ALL.stream()
                .map(a -> {
                    UserAchievement ua = unlocked.get(a.code());
                    return ua == null
                            ? AchievementResponse.locked(a)
                            : AchievementResponse.unlocked(a, ua.getUnlockedAt(), !ua.isAcknowledged());
                })
                .toList();
    }

    @Transactional
    public void ack(UUID userId) {
        userAchievementRepository.acknowledgeAllForUser(userId);
    }

    @Transactional
    public void evaluate(UUID userId) {
        Set<String> alreadyUnlocked = userAchievementRepository.findByUserId(userId).stream()
                .map(UserAchievement::getCode)
                .collect(Collectors.toSet());

        List<String> locked = AchievementCatalog.ALL.stream()
                .map(Achievement::code)
                .filter(code -> !alreadyUnlocked.contains(code))
                .toList();
        if (locked.isEmpty()) {
            return;
        }

        Map<String, Boolean> results = computeResults(userId);

        for (String code : locked) {
            if (Boolean.TRUE.equals(results.get(code))) {
                UserAchievement ua = new UserAchievement();
                ua.setUser(userRepository.getReferenceById(userId));
                ua.setCode(code);
                userAchievementRepository.save(ua);
            }
        }
    }

    private Map<String, Boolean> computeResults(UUID userId) {
        List<TrainingSession> completedSessions =
                sessionRepository.findByUserIdAndStatusOrderByFinishedAtAsc(userId, SessionStatus.COMPLETED);

        long totalCompleted = completedSessions.size();

        BigDecimal totalVolume = BigDecimal.ZERO;
        BigDecimal maxSessionVolume = BigDecimal.ZERO;
        for (TrainingSession s : completedSessions) {
            BigDecimal v = s.getTotalVolumeKg() != null ? s.getTotalVolumeKg() : BigDecimal.ZERO;
            totalVolume = totalVolume.add(v);
            if (v.compareTo(maxSessionVolume) > 0) {
                maxSessionVolume = v;
            }
        }

        boolean earlyBird = completedSessions.stream()
                .anyMatch(s -> LocalDateTime.ofInstant(s.getStartedAt(), ZONE).toLocalTime().isBefore(LocalTime.of(6, 0)));

        List<LocalDate> distinctDays = completedSessions.stream()
                .map(s -> LocalDate.ofInstant(effectiveInstant(s), ZONE))
                .distinct()
                .sorted()
                .toList();

        boolean yearOfWork = distinctDays.size() >= 2
                && ChronoUnit.DAYS.between(distinctDays.get(0), distinctDays.get(distinctDays.size() - 1)) >= 365;

        boolean holidayWorkout = distinctDays.stream().anyMatch(d -> FIXED_HOLIDAYS.contains(MonthDay.from(d)));

        boolean perfectMonth = distinctDays.stream()
                .collect(Collectors.groupingBy(YearMonth::from, Collectors.counting()))
                .entrySet().stream()
                .anyMatch(e -> e.getValue() >= e.getKey().lengthOfMonth());

        boolean weekendWarrior = hasWeekendWarrior(distinctDays);

        int maxStreak = 0;
        int streakCrossings7 = 0;
        boolean comeback = false;
        if (!distinctDays.isEmpty()) {
            int streak = 1;
            maxStreak = 1;
            for (int i = 1; i < distinctDays.size(); i++) {
                long gap = ChronoUnit.DAYS.between(distinctDays.get(i - 1), distinctDays.get(i));
                int previousStreak = streak;
                streak = (gap == 1) ? streak + 1 : 1;
                if (gap >= 8) {
                    comeback = true;
                }
                if (streak > maxStreak) {
                    maxStreak = streak;
                }
                if (streak >= 7 && previousStreak < 7) {
                    streakCrossings7++;
                }
            }
        }

        List<SessionSet> prSetsAsc = sessionSetRepository.findPersonalRecordsByUserId(userId).reversed();
        long totalPRs = prSetsAsc.size();
        boolean prStreakWeek = hasWeekWithAtLeastNPrs(prSetsAsc, 3);
        boolean bigJump = hasBigJump(prSetsAsc);

        List<SessionSet> allSetsAsc = sessionSetRepository.findAllCompletedByUserId(userId);
        boolean newMuscleGroup = hasNewMuscleGroup(allSetsAsc);
        boolean progressiveOverload = hasProgressiveOverload(allSetsAsc);

        long createdWorkouts = workoutRepository.countByUserId(userId);
        long createdPrograms = programRepository.countByUserId(userId);
        long completedProgramsCount = programRepository.countByUserIdAndStatus(userId, ProgramStatus.COMPLETED);

        boolean noSkipsProgram = false;
        boolean noSkips10 = false;
        boolean resumedProgram = false;

        for (Program p : programRepository.findAllByUserIdAndStatus(userId, ProgramStatus.COMPLETED)) {
            ProgramDayStats stats = programDayStats(p);
            if (!stats.nonRestDayIds().isEmpty() && stats.completedDayIds().containsAll(stats.nonRestDayIds())) {
                noSkipsProgram = true;
            }
            if (hasResumeGap(stats.completedTimestampsAsc())) {
                resumedProgram = true;
            }
        }

        Optional<Program> activeProgram = programRepository.findByUserIdAndStatus(userId, ProgramStatus.ACTIVE);
        if (activeProgram.isPresent()) {
            ProgramDayStats stats = programDayStats(activeProgram.get());
            long abandonedCount = stats.nonRestDayIds().isEmpty() ? 0
                    : sessionRepository.findByProgramDayIdInAndStatusOrderByFinishedAtDesc(
                            stats.nonRestDayIds(), SessionStatus.ABANDONED).size();
            if (stats.completedDayIds().size() >= 10 && abandonedCount == 0) {
                noSkips10 = true;
            }
            if (hasResumeGap(stats.completedTimestampsAsc())) {
                resumedProgram = true;
            }
        }

        Map<String, Boolean> results = new HashMap<>();
        results.put("FIRST_WORKOUT", totalCompleted >= 1);
        results.put("WORKOUTS_10", totalCompleted >= 10);
        results.put("WORKOUTS_50", totalCompleted >= 50);
        results.put("WORKOUTS_100", totalCompleted >= 100);
        results.put("WORKOUTS_500", totalCompleted >= 500);
        results.put("YEAR_OF_WORK", yearOfWork);
        results.put("STREAK_7", maxStreak >= 7);
        results.put("STREAK_30", maxStreak >= 30);
        results.put("STREAK_100", maxStreak >= 100);
        results.put("PERFECT_MONTH", perfectMonth);
        results.put("FIRST_PR", totalPRs >= 1);
        results.put("PR_10", totalPRs >= 10);
        results.put("PR_50", totalPRs >= 50);
        results.put("PR_STREAK_WEEK", prStreakWeek);
        results.put("BIG_JUMP", bigJump);
        results.put("VOLUME_10K", totalVolume.compareTo(BigDecimal.valueOf(10_000)) >= 0);
        results.put("VOLUME_100K", totalVolume.compareTo(BigDecimal.valueOf(100_000)) >= 0);
        results.put("VOLUME_1M", totalVolume.compareTo(BigDecimal.valueOf(1_000_000)) >= 0);
        results.put("HEAVY_SESSION", maxSessionVolume.compareTo(BigDecimal.valueOf(5_000)) >= 0);
        results.put("PROGRAM_1", completedProgramsCount >= 1);
        results.put("PROGRAM_3", completedProgramsCount >= 3);
        results.put("CREATED_WORKOUT", createdWorkouts >= 1);
        results.put("CREATED_PROGRAM", createdPrograms >= 1);
        results.put("NO_SKIPS_10", noSkips10);
        results.put("EARLY_BIRD", earlyBird);
        results.put("WEEKEND_WARRIOR", weekendWarrior);
        results.put("NEW_MUSCLE_GROUP", newMuscleGroup);
        results.put("PROGRESSIVE_OVERLOAD", progressiveOverload);
        results.put("NO_SKIPS_PROGRAM", noSkipsProgram);
        results.put("HOLIDAY_WORKOUT", holidayWorkout);
        results.put("COMEBACK", comeback);
        results.put("SECOND_STREAK", streakCrossings7 >= 2);
        results.put("RESUMED_PROGRAM", resumedProgram);
        return results;
    }

    private boolean hasWeekWithAtLeastNPrs(List<SessionSet> prSetsAsc, int n) {
        Map<String, Long> byWeek = prSetsAsc.stream()
                .map(ss -> weekKey(LocalDate.ofInstant(ss.getCompletedAt(), ZONE)))
                .collect(Collectors.groupingBy(k -> k, Collectors.counting()));
        return byWeek.values().stream().anyMatch(c -> c >= n);
    }

    private boolean hasBigJump(List<SessionSet> prSetsAsc) {
        Map<UUID, BigDecimal> maxWeightByExercise = new HashMap<>();
        for (SessionSet ss : prSetsAsc) {
            UUID exerciseId = ss.getSessionExercise().getExercise().getId();
            BigDecimal previousMax = maxWeightByExercise.get(exerciseId);
            if (previousMax != null
                    && ss.getWeightKg().compareTo(previousMax.multiply(BigDecimal.valueOf(1.2))) >= 0) {
                return true;
            }
            if (previousMax == null || ss.getWeightKg().compareTo(previousMax) > 0) {
                maxWeightByExercise.put(exerciseId, ss.getWeightKg());
            }
        }
        return false;
    }

    private boolean hasNewMuscleGroup(List<SessionSet> allSetsAsc) {
        Map<UUID, Set<ExerciseCategory>> categoriesBySession = new LinkedHashMap<>();
        for (SessionSet ss : allSetsAsc) {
            UUID sessionId = ss.getSessionExercise().getSession().getId();
            ExerciseCategory category = ss.getSessionExercise().getExercise().getCategory();
            categoriesBySession.computeIfAbsent(sessionId, k -> new HashSet<>()).add(category);
        }
        Set<ExerciseCategory> seen = new HashSet<>();
        boolean first = true;
        for (Set<ExerciseCategory> categories : categoriesBySession.values()) {
            if (!first && !seen.containsAll(categories)) {
                return true;
            }
            seen.addAll(categories);
            first = false;
        }
        return false;
    }

    private boolean hasProgressiveOverload(List<SessionSet> allSetsAsc) {
        Map<UUID, Map<UUID, BigDecimal>> maxWeightByExerciseThenSession = new LinkedHashMap<>();
        for (SessionSet ss : allSetsAsc) {
            UUID exerciseId = ss.getSessionExercise().getExercise().getId();
            UUID sessionId = ss.getSessionExercise().getSession().getId();
            Map<UUID, BigDecimal> perSession =
                    maxWeightByExerciseThenSession.computeIfAbsent(exerciseId, k -> new LinkedHashMap<>());
            perSession.merge(sessionId, ss.getWeightKg(), BigDecimal::max);
        }
        for (Map<UUID, BigDecimal> perSession : maxWeightByExerciseThenSession.values()) {
            List<BigDecimal> weights = new ArrayList<>(perSession.values());
            int consecutive = 1;
            for (int i = 1; i < weights.size(); i++) {
                if (weights.get(i).compareTo(weights.get(i - 1)) > 0) {
                    consecutive++;
                    if (consecutive >= 3) {
                        return true;
                    }
                } else {
                    consecutive = 1;
                }
            }
        }
        return false;
    }

    private boolean hasWeekendWarrior(List<LocalDate> distinctDays) {
        Map<String, EnumSet<DayOfWeek>> byWeek = new HashMap<>();
        for (LocalDate d : distinctDays) {
            DayOfWeek dow = d.getDayOfWeek();
            if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) {
                byWeek.computeIfAbsent(weekKey(d), k -> EnumSet.noneOf(DayOfWeek.class)).add(dow);
            }
        }
        return byWeek.values().stream().anyMatch(s -> s.contains(DayOfWeek.SATURDAY) && s.contains(DayOfWeek.SUNDAY));
    }

    private boolean hasResumeGap(List<Instant> timestampsAsc) {
        for (int i = 1; i < timestampsAsc.size(); i++) {
            if (ChronoUnit.DAYS.between(timestampsAsc.get(i - 1), timestampsAsc.get(i)) >= 14) {
                return true;
            }
        }
        return false;
    }

    private Instant effectiveInstant(TrainingSession session) {
        return session.getFinishedAt() != null ? session.getFinishedAt() : session.getStartedAt();
    }

    private String weekKey(LocalDate date) {
        int week = date.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);
        int year = date.get(IsoFields.WEEK_BASED_YEAR);
        return year + "-W" + week;
    }

    private ProgramDayStats programDayStats(Program program) {
        List<UUID> nonRestDayIds = program.getWeeks().stream()
                .flatMap(w -> w.getDays().stream())
                .filter(d -> !d.isRestDay())
                .map(ProgramDay::getId)
                .toList();
        if (nonRestDayIds.isEmpty()) {
            return new ProgramDayStats(List.of(), Set.of(), List.of());
        }

        List<TrainingSession> completed = sessionRepository
                .findByProgramDayIdInAndStatusOrderByFinishedAtDesc(nonRestDayIds, SessionStatus.COMPLETED);
        Set<UUID> completedDayIds = new LinkedHashSet<>();
        List<Instant> timestamps = new ArrayList<>();
        for (TrainingSession s : completed) {
            completedDayIds.add(s.getProgramDay().getId());
            timestamps.add(effectiveInstant(s));
        }
        timestamps.sort(Comparator.naturalOrder());
        return new ProgramDayStats(nonRestDayIds, completedDayIds, timestamps);
    }

    private record ProgramDayStats(List<UUID> nonRestDayIds, Set<UUID> completedDayIds,
            List<Instant> completedTimestampsAsc) {
    }
}
