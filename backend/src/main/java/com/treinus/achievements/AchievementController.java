package com.treinus.achievements;

import com.treinus.achievements.dto.AchievementResponse;
import com.treinus.users.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/achievements")
@Tag(name = "Achievements", description = "Conquistas do usuário")
@SecurityRequirement(name = "bearerAuth")
public class AchievementController {

    private final AchievementService achievementService;

    public AchievementController(AchievementService achievementService) {
        this.achievementService = achievementService;
    }

    @GetMapping
    @Operation(summary = "Lista o catálogo completo de conquistas com o status do usuário autenticado")
    public ResponseEntity<List<AchievementResponse>> getAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(achievementService.getAll(user.getId()));
    }

    @PostMapping("/ack")
    @Operation(summary = "Marca todas as conquistas novas como vistas")
    public ResponseEntity<Void> ack(@AuthenticationPrincipal User user) {
        achievementService.ack(user.getId());
        return ResponseEntity.noContent().build();
    }
}
