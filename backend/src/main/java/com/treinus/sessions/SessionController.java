package com.treinus.sessions;

import com.treinus.sessions.dto.*;
import com.treinus.users.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sessions")
@Tag(name = "Sessions", description = "Execução de treinos")
@SecurityRequirement(name = "bearerAuth")
public class SessionController {

    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @GetMapping("/current")
    @Operation(summary = "Obter sessão de treino em andamento")
    public ResponseEntity<SessionResponse> getCurrent(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(sessionService.getCurrent(user.getId()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obter sessão por ID")
    public ResponseEntity<SessionResponse> getById(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        return ResponseEntity.ok(sessionService.getById(id, user.getId()));
    }

    @PostMapping("/start")
    @Operation(summary = "Iniciar sessão de treino")
    public ResponseEntity<SessionResponse> start(
            @AuthenticationPrincipal User user,
            @RequestBody StartSessionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sessionService.start(request, user.getId()));
    }

    @PostMapping("/{id}/exercises/{sessionExerciseId}/sets")
    @Operation(summary = "Registrar série executada")
    public ResponseEntity<SessionResponse> recordSet(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @PathVariable UUID sessionExerciseId,
            @Valid @RequestBody RecordSetRequest request) {
        return ResponseEntity.ok(sessionService.recordSet(id, sessionExerciseId, request, user.getId()));
    }

    @PostMapping("/{id}/exercises/{sessionExerciseId}/skip")
    @Operation(summary = "Pular exercício")
    public ResponseEntity<SessionResponse> skipExercise(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @PathVariable UUID sessionExerciseId,
            @RequestBody SkipExerciseRequest request) {
        return ResponseEntity.ok(sessionService.skipExercise(id, sessionExerciseId, request, user.getId()));
    }

    @PostMapping("/{id}/finish")
    @Operation(summary = "Finalizar treino e obter resumo")
    public ResponseEntity<SessionSummaryResponse> finish(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        return ResponseEntity.ok(sessionService.finish(id, user.getId()));
    }

    @PostMapping("/{id}/abandon")
    @Operation(summary = "Abandonar sessão de treino")
    public ResponseEntity<Void> abandon(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        sessionService.abandon(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
