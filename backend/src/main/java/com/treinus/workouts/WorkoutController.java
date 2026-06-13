package com.treinus.workouts;

import com.treinus.users.User;
import com.treinus.workouts.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workouts")
@Tag(name = "Workouts", description = "Treinos do usuário")
@SecurityRequirement(name = "bearerAuth")
public class WorkoutController {

    private final WorkoutService workoutService;

    public WorkoutController(WorkoutService workoutService) {
        this.workoutService = workoutService;
    }

    @GetMapping
    @Operation(summary = "Listar treinos do usuário")
    public ResponseEntity<List<WorkoutResponse>> list(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workoutService.findAllByUser(user.getId()));
    }

    @GetMapping("/presets")
    @Operation(summary = "Listar treinos preset da plataforma")
    public ResponseEntity<List<WorkoutResponse>> listPresets() {
        return ResponseEntity.ok(workoutService.findAllPresets());
    }

    @PostMapping("/{id}/adopt")
    @Operation(summary = "Adotar um treino preset como próprio")
    public ResponseEntity<WorkoutResponse> adopt(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        return ResponseEntity.status(HttpStatus.CREATED).body(workoutService.adopt(id, user.getId()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obter treino por ID")
    public ResponseEntity<WorkoutResponse> getById(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        return ResponseEntity.ok(workoutService.findById(id, user.getId()));
    }

    @PostMapping
    @Operation(summary = "Criar novo treino")
    public ResponseEntity<WorkoutResponse> create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateWorkoutRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(workoutService.create(request, user.getId()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar treino")
    public ResponseEntity<WorkoutResponse> update(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @Valid @RequestBody CreateWorkoutRequest request) {
        return ResponseEntity.ok(workoutService.update(id, request, user.getId()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deletar treino")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        workoutService.delete(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/exercises")
    @Operation(summary = "Adicionar exercício ao treino")
    public ResponseEntity<WorkoutResponse> addExercise(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @Valid @RequestBody AddExerciseToWorkoutRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workoutService.addExercise(id, request, user.getId()));
    }

    @PatchMapping("/{id}/exercises/{workoutExerciseId}")
    @Operation(summary = "Atualizar exercício no treino")
    public ResponseEntity<WorkoutResponse> updateExercise(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @PathVariable UUID workoutExerciseId,
            @Valid @RequestBody UpdateWorkoutExerciseRequest request) {
        return ResponseEntity.ok(workoutService.updateExercise(id, workoutExerciseId, request, user.getId()));
    }

    @DeleteMapping("/{id}/exercises/{workoutExerciseId}")
    @Operation(summary = "Remover exercício do treino")
    public ResponseEntity<WorkoutResponse> removeExercise(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @PathVariable UUID workoutExerciseId) {
        return ResponseEntity.ok(workoutService.removeExercise(id, workoutExerciseId, user.getId()));
    }

    @PutMapping("/{id}/exercises/reorder")
    @Operation(summary = "Reordenar exercícios do treino")
    public ResponseEntity<WorkoutResponse> reorder(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @RequestBody List<UUID> orderedWorkoutExerciseIds) {
        return ResponseEntity.ok(workoutService.reorderExercises(id, orderedWorkoutExerciseIds, user.getId()));
    }
}
