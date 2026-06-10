package com.treinus.exercises;

import com.treinus.exercises.dto.CreateExerciseRequest;
import com.treinus.exercises.dto.ExerciseResponse;
import com.treinus.shared.exception.BusinessException;
import com.treinus.shared.exception.ResourceNotFoundException;
import com.treinus.users.User;
import com.treinus.users.UserRepository;
import com.treinus.users.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ExerciseService {

    private final ExerciseRepository exerciseRepository;
    private final UserRepository userRepository;

    public ExerciseService(ExerciseRepository exerciseRepository, UserRepository userRepository) {
        this.exerciseRepository = exerciseRepository;
        this.userRepository = userRepository;
    }

    public Page<ExerciseResponse> findAll(UUID userId, ExerciseCategory category,
                                          Equipment equipment, Pageable pageable) {
        return exerciseRepository
                .findAccessibleByUser(userId, category, equipment, pageable)
                .map(ExerciseResponse::from);
    }

    public ExerciseResponse findById(UUID id, UUID userId) {
        Exercise exercise = exerciseRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Exercise", id));

        if (!exercise.isGlobal() && !exercise.getCreatedBy().getId().equals(userId)) {
            throw new ResourceNotFoundException("Exercise not found: " + id);
        }

        return ExerciseResponse.from(exercise);
    }

    @Transactional
    public ExerciseResponse createGlobal(CreateExerciseRequest request) {
        Exercise exercise = buildExercise(request, null, true);
        return ExerciseResponse.from(exerciseRepository.save(exercise));
    }

    @Transactional
    public ExerciseResponse createCustom(CreateExerciseRequest request, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("User", userId));

        Exercise exercise = buildExercise(request, user, false);
        return ExerciseResponse.from(exerciseRepository.save(exercise));
    }

    @Transactional
    public void delete(UUID id, UUID userId, boolean isAdmin) {
        Exercise exercise = exerciseRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Exercise", id));

        if (exercise.isGlobal() && !isAdmin) {
            throw new BusinessException("Only admins can delete global exercises");
        }

        if (!exercise.isGlobal() && !exercise.getCreatedBy().getId().equals(userId) && !isAdmin) {
            throw new ResourceNotFoundException("Exercise not found: " + id);
        }

        exerciseRepository.delete(exercise);
    }

    private Exercise buildExercise(CreateExerciseRequest request, User createdBy, boolean global) {
        Exercise exercise = new Exercise();
        exercise.setName(request.name());
        exercise.setDescription(request.description());
        exercise.setCategory(request.category());
        exercise.setPrimaryMuscleGroup(request.primaryMuscleGroup());
        exercise.setEquipment(request.equipment());
        exercise.setGlobal(global);
        exercise.setCreatedBy(createdBy);
        return exercise;
    }
}
