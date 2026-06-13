package com.treinus.programs;

import com.treinus.programs.dto.*;
import com.treinus.users.User;
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
@RequestMapping("/api/v1/programs")
@Tag(name = "Programs", description = "Programas de treino")
@SecurityRequirement(name = "bearerAuth")
public class ProgramController {

    private final ProgramService programService;

    public ProgramController(ProgramService programService) {
        this.programService = programService;
    }

    @GetMapping
    @Operation(summary = "Listar programas do usuário")
    public ResponseEntity<List<ProgramResponse>> list(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(programService.findAllByUser(user.getId()));
    }

    @GetMapping("/active")
    @Operation(summary = "Obter programa ativo")
    public ResponseEntity<ProgramResponse> getActive(@AuthenticationPrincipal User user) {
        return programService.findActive(user.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obter programa por ID")
    public ResponseEntity<ProgramResponse> getById(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        return ResponseEntity.ok(programService.findById(id, user.getId()));
    }

    @PostMapping
    @Operation(summary = "Criar novo programa")
    public ResponseEntity<ProgramResponse> create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateProgramRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(programService.create(request, user.getId()));
    }

    @PostMapping("/{id}/start")
    @Operation(summary = "Iniciar programa (cancela o ativo atual, se houver)")
    public ResponseEntity<ProgramResponse> start(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        return ResponseEntity.ok(programService.start(id, user.getId()));
    }

    @PostMapping("/{id}/finish")
    @Operation(summary = "Concluir programa ativo")
    public ResponseEntity<ProgramResponse> finish(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        return ResponseEntity.ok(programService.finish(id, user.getId()));
    }

    @PostMapping("/{id}/weeks")
    @Operation(summary = "Adicionar semana ao programa")
    public ResponseEntity<ProgramResponse> addWeek(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @Valid @RequestBody CreateProgramWeekRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(programService.addWeek(id, request, user.getId()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar nome/descrição do programa")
    public ResponseEntity<ProgramResponse> update(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProgramRequest request) {
        return ResponseEntity.ok(programService.update(id, request, user.getId()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir programa")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        programService.delete(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/weeks/{weekId}/days")
    @Operation(summary = "Adicionar dia de treino/descanso à semana")
    public ResponseEntity<ProgramResponse> addDay(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @PathVariable UUID weekId,
            @Valid @RequestBody CreateProgramDayRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(programService.addDay(id, weekId, request, user.getId()));
    }

    @PutMapping("/{id}/weeks/{weekId}/days/{dayId}")
    @Operation(summary = "Atualizar dia (trocar treino ou marcar descanso)")
    public ResponseEntity<ProgramResponse> updateDay(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @PathVariable UUID weekId,
            @PathVariable UUID dayId,
            @Valid @RequestBody UpdateProgramDayRequest request) {
        return ResponseEntity.ok(programService.updateDay(id, weekId, dayId, request, user.getId()));
    }

    @DeleteMapping("/{id}/weeks/{weekId}")
    @Operation(summary = "Remover semana do programa")
    public ResponseEntity<ProgramResponse> removeWeek(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @PathVariable UUID weekId) {
        return ResponseEntity.ok(programService.removeWeek(id, weekId, user.getId()));
    }

    @DeleteMapping("/{id}/weeks/{weekId}/days/{dayId}")
    @Operation(summary = "Remover dia da semana")
    public ResponseEntity<ProgramResponse> removeDay(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @PathVariable UUID weekId,
            @PathVariable UUID dayId) {
        return ResponseEntity.ok(programService.removeDay(id, weekId, dayId, user.getId()));
    }
}
