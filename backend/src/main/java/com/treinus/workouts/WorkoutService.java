package com.treinus.workouts;

import com.treinus.exercises.Exercise;
import com.treinus.exercises.ExerciseRepository;
import com.treinus.shared.exception.BusinessException;
import com.treinus.shared.exception.ResourceNotFoundException;
import com.treinus.users.User;
import com.treinus.users.UserRepository;
import com.treinus.workouts.dto.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class WorkoutService {

    private final WorkoutRepository workoutRepository;
    private final WorkoutExerciseRepository workoutExerciseRepository;
    private final ExerciseRepository exerciseRepository;
    private final UserRepository userRepository;

    public WorkoutService(WorkoutRepository workoutRepository,
                          WorkoutExerciseRepository workoutExerciseRepository,
                          ExerciseRepository exerciseRepository,
                          UserRepository userRepository) {
        this.workoutRepository = workoutRepository;
        this.workoutExerciseRepository = workoutExerciseRepository;
        this.exerciseRepository = exerciseRepository;
        this.userRepository = userRepository;
    }

    public List<WorkoutResponse> findAllByUser(UUID userId) {
        return workoutRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(WorkoutResponse::from)
                .toList();
    }

    public WorkoutResponse findById(UUID id, UUID userId) {
        return WorkoutResponse.from(findWorkout(id, userId));
    }

    @Transactional
    public WorkoutResponse create(CreateWorkoutRequest request, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("User", userId));

        Workout workout = new Workout();
        workout.setName(request.name());
        workout.setDescription(request.description());
        workout.setUser(user);

        return WorkoutResponse.from(workoutRepository.save(workout));
    }

    @Transactional
    public WorkoutResponse update(UUID id, CreateWorkoutRequest request, UUID userId) {
        Workout workout = findWorkout(id, userId);
        workout.setName(request.name());
        workout.setDescription(request.description());
        return WorkoutResponse.from(workoutRepository.save(workout));
    }

    @Transactional
    public void delete(UUID id, UUID userId) {
        Workout workout = findWorkout(id, userId);
        workoutRepository.delete(workout);
    }

    @Transactional
    public WorkoutResponse addExercise(UUID workoutId, AddExerciseToWorkoutRequest request, UUID userId) {
        Workout workout = findWorkout(workoutId, userId);
        Exercise exercise = exerciseRepository.findById(request.exerciseId())
                .orElseThrow(() -> ResourceNotFoundException.of("Exercise", request.exerciseId()));

        int nextOrder = workoutExerciseRepository.findMaxOrderIndex(workoutId) + 1;

        WorkoutExercise we = new WorkoutExercise();
        we.setWorkout(workout);
        we.setExercise(exercise);
        we.setOrderIndex(nextOrder);
        we.setPlannedSets(request.plannedSets());
        we.setPlannedRepsMin(request.plannedRepsMin());
        we.setPlannedRepsMax(request.plannedRepsMax());
        we.setPlannedWeightKg(request.plannedWeightKg());
        we.setRestSeconds(request.restSeconds() != null ? request.restSeconds() : 60);
        we.setNotes(request.notes());

        workout.getExercises().add(we);
        return WorkoutResponse.from(workoutRepository.save(workout));
    }

    @Transactional
    public WorkoutResponse updateExercise(UUID workoutId, UUID workoutExerciseId,
                                          UpdateWorkoutExerciseRequest request, UUID userId) {
        findWorkout(workoutId, userId);
        WorkoutExercise we = workoutExerciseRepository.findByIdAndWorkoutId(workoutExerciseId, workoutId)
                .orElseThrow(() -> ResourceNotFoundException.of("WorkoutExercise", workoutExerciseId));

        if (request.plannedSets() != null) we.setPlannedSets(request.plannedSets());
        if (request.plannedRepsMin() != null) we.setPlannedRepsMin(request.plannedRepsMin());
        if (request.plannedRepsMax() != null) we.setPlannedRepsMax(request.plannedRepsMax());
        if (request.plannedWeightKg() != null) we.setPlannedWeightKg(request.plannedWeightKg());
        if (request.restSeconds() != null) we.setRestSeconds(request.restSeconds());
        if (request.notes() != null) we.setNotes(request.notes());

        workoutExerciseRepository.save(we);
        return WorkoutResponse.from(workoutRepository.findById(workoutId)
                .orElseThrow(() -> ResourceNotFoundException.of("Workout", workoutId)));
    }

    @Transactional
    public WorkoutResponse removeExercise(UUID workoutId, UUID workoutExerciseId, UUID userId) {
        Workout workout = findWorkout(workoutId, userId);
        WorkoutExercise we = workoutExerciseRepository.findByIdAndWorkoutId(workoutExerciseId, workoutId)
                .orElseThrow(() -> ResourceNotFoundException.of("WorkoutExercise", workoutExerciseId));

        workout.getExercises().remove(we);
        reindexExercises(workout);
        return WorkoutResponse.from(workoutRepository.save(workout));
    }

    @Transactional
    public WorkoutResponse reorderExercises(UUID workoutId, List<UUID> orderedIds, UUID userId) {
        Workout workout = findWorkout(workoutId, userId);

        if (orderedIds.size() != workout.getExercises().size()) {
            throw new BusinessException("Ordered IDs count doesn't match workout exercises count");
        }

        for (int i = 0; i < orderedIds.size(); i++) {
            final int index = i;
            UUID weId = orderedIds.get(i);
            WorkoutExercise we = workout.getExercises().stream()
                    .filter(e -> e.getId().equals(weId))
                    .findFirst()
                    .orElseThrow(() -> ResourceNotFoundException.of("WorkoutExercise", weId));
            we.setOrderIndex(index);
        }

        return WorkoutResponse.from(workoutRepository.save(workout));
    }

    private Workout findWorkout(UUID id, UUID userId) {
        return workoutRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> ResourceNotFoundException.of("Workout", id));
    }

    private void reindexExercises(Workout workout) {
        List<WorkoutExercise> exercises = workout.getExercises();
        for (int i = 0; i < exercises.size(); i++) {
            exercises.get(i).setOrderIndex(i);
        }
    }
}
