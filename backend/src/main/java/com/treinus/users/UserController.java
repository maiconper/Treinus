package com.treinus.users;

import com.treinus.users.dto.OnboardingRequest;
import com.treinus.users.dto.UpdateProfileRequest;
import com.treinus.users.dto.UserResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Users", description = "Perfil e dados do usuário")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    @Operation(summary = "Obter dados do usuário autenticado")
    public ResponseEntity<UserResponse> getMe(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(userService.getUser(user.getId()));
    }

    @PutMapping("/me/profile")
    @Operation(summary = "Atualizar perfil do usuário")
    public ResponseEntity<UserResponse> updateProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(user.getId(), request));
    }

    @PostMapping("/me/onboarding")
    @Operation(summary = "Completar onboarding inicial")
    public ResponseEntity<UserResponse> completeOnboarding(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody OnboardingRequest request) {
        return ResponseEntity.ok(userService.completeOnboarding(user.getId(), request));
    }
}
