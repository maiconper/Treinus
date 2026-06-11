package com.treinus.progress;

import com.treinus.exercises.Exercise;
import com.treinus.exercises.ExerciseRepository;
import com.treinus.progress.dto.ExerciseProgressResponse;
import com.treinus.progress.dto.ProgressSummaryResponse;
import com.treinus.progress.dto.WorkoutHistoryResponse;
import com.treinus.sessions.SessionStatus;
import com.treinus.sessions.TrainingSession;
import com.treinus.sessions.TrainingSessionRepository;
import com.treinus.shared.exception.ResourceNotFoundException;
import com.treinus.users.UserProfile;
import com.treinus.users.UserProfileRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.UUID;

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

        return new ProgressSummaryResponse(
                profile != null ? profile.getXp() : 0,
                profile != null ? profile.getStreak() : 0,
                totalWorkouts,
                workoutsThisWeek,
                volumeThisWeek,
                volumeLastWeek,
                profile != null ? profile.getLastWorkoutDate() : null
        );
    }

    public Page<WorkoutHistoryResponse> getHistory(UUID userId, Pageable pageable) {
        return sessionRepository
                .findByUserIdAndStatusOrderByStartedAtDesc(userId, SessionStatus.COMPLETED, pageable)
                .map(session -> {
                    int totalSets = session.getExercises().stream()
                            .mapToInt(se -> se.getSets().size())
                            .sum();
                    return WorkoutHistoryResponse.from(session, totalSets);
                });
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
