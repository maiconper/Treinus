package com.treinus.exercises;

import com.treinus.exercises.dto.CreateExerciseRequest;
import com.treinus.exercises.dto.ExerciseResponse;
import com.treinus.exercises.exercisedb.ExerciseSyncService;
import com.treinus.exercises.exercisedb.SyncResult;
import com.treinus.users.User;
import com.treinus.users.UserRole;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.concurrent.TimeUnit;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/exercises")
@Tag(name = "Exercises", description = "Catálogo de exercícios")
@SecurityRequirement(name = "bearerAuth")
public class ExerciseController {

    private final ExerciseService exerciseService;
    private final ExerciseSyncService exerciseSyncService;

    public ExerciseController(ExerciseService exerciseService, ExerciseSyncService exerciseSyncService) {
        this.exerciseService = exerciseService;
        this.exerciseSyncService = exerciseSyncService;
    }

    @GetMapping
    @Operation(summary = "Listar exercícios (catálogo global + personalizados do usuário)")
    public ResponseEntity<Page<ExerciseResponse>> list(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) ExerciseCategory category,
            @RequestParam(required = false) Equipment equipment,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(exerciseService.findAll(user.getId(), category, equipment, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obter exercício por ID")
    public ResponseEntity<ExerciseResponse> getById(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        return ResponseEntity.ok(exerciseService.findById(id, user.getId()));
    }

    @GetMapping("/{id}/gif")
    @Operation(hidden = true)
    public ResponseEntity<byte[]> getGif(@PathVariable UUID id) {
        try {
            byte[] image = exerciseSyncService.getGif(id);
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_GIF)
                    .cacheControl(CacheControl.maxAge(90, TimeUnit.DAYS).cachePublic())
                    .body(image);
        } catch (java.util.NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/sync-gifs")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Sincronizar GIFs dos exercícios globais com ExerciseDB (admin)")
    public ResponseEntity<SyncResult> syncGifs() {
        return ResponseEntity.ok(exerciseSyncService.syncGifs());
    }

    @PostMapping("/global")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Criar exercício no catálogo global (admin)")
    public ResponseEntity<ExerciseResponse> createGlobal(
            @Valid @RequestBody CreateExerciseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(exerciseService.createGlobal(request));
    }

    @PostMapping
    @Operation(summary = "Criar exercício personalizado")
    public ResponseEntity<ExerciseResponse> createCustom(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateExerciseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(exerciseService.createCustom(request, user.getId()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deletar exercício")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        boolean isAdmin = user.getRole() == UserRole.ADMIN;
        exerciseService.delete(id, user.getId(), isAdmin);
        return ResponseEntity.noContent().build();
    }
}
