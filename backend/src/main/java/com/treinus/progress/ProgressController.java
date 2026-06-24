package com.treinus.progress;

import com.treinus.progress.dto.ExerciseProgressResponse;
import com.treinus.progress.dto.ProgressSummaryResponse;
import com.treinus.progress.dto.WorkoutHistoryResponse;
import com.treinus.users.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/progress")
@Tag(name = "Progress", description = "Progresso, histórico e estatísticas")
@SecurityRequirement(name = "bearerAuth")
public class ProgressController {

    private final ProgressService progressService;

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    @GetMapping("/summary")
    @Operation(summary = "Resumo geral do progresso do usuário")
    public ResponseEntity<ProgressSummaryResponse> getSummary(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(progressService.getSummary(user.getId()));
    }

    @GetMapping("/history")
    @Operation(summary = "Histórico de treinos concluídos")
    public ResponseEntity<?> getHistory(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String zone,
            @PageableDefault(size = 20) Pageable pageable) {
        if (date != null) {
            List<WorkoutHistoryResponse> result = progressService.getHistoryForDate(user.getId(), date, zone);
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.ok(progressService.getHistory(user.getId(), pageable));
    }

    @GetMapping("/exercises/{exerciseId}")
    @Operation(summary = "Progresso por exercício (cargas, PRs e histórico de séries)")
    public ResponseEntity<ExerciseProgressResponse> getExerciseProgress(
            @AuthenticationPrincipal User user,
            @PathVariable UUID exerciseId) {
        return ResponseEntity.ok(progressService.getExerciseProgress(user.getId(), exerciseId));
    }
}
