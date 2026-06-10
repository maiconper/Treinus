package com.treinus.auth;

import com.treinus.auth.dto.AuthResponse;
import com.treinus.auth.dto.LoginRequest;
import com.treinus.auth.dto.RegisterRequest;
import com.treinus.shared.exception.BusinessException;
import com.treinus.shared.exception.ConflictException;
import com.treinus.users.*;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       UserProfileRepository userProfileRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Email already in use: " + request.email());
        }

        User user = new User();
        user.setEmail(request.email());
        user.setName(request.name());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(UserRole.USER);
        userRepository.save(user);

        UserProfile profile = new UserProfile();
        profile.setUser(user);
        userProfileRepository.save(profile);

        return buildAuthResponse(user, profile);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElse(null);
        return buildAuthResponse(user, profile);
    }

    @Transactional(readOnly = true)
    public AuthResponse refresh(String refreshToken) {
        if (!jwtService.isRefreshToken(refreshToken)) {
            throw new BusinessException("Invalid or expired refresh token");
        }

        String email = jwtService.extractEmail(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("User not found"));

        UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElse(null);
        return buildAuthResponse(user, profile);
    }

    private AuthResponse buildAuthResponse(User user, UserProfile profile) {
        String role = user.getRole().name();
        String accessToken = jwtService.generateAccessToken(user.getEmail(), user.getId(), role);
        String refreshToken = jwtService.generateRefreshToken(user.getEmail(), user.getId(), role);
        boolean onboarded = profile != null && Boolean.TRUE.equals(profile.getOnboardingCompleted());

        return new AuthResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                role,
                accessToken,
                refreshToken,
                900L,
                onboarded
        );
    }
}
