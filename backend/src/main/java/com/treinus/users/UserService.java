package com.treinus.users;

import com.treinus.shared.exception.BusinessException;
import com.treinus.shared.exception.ResourceNotFoundException;
import com.treinus.users.dto.OnboardingRequest;
import com.treinus.users.dto.UpdateProfileRequest;
import com.treinus.users.dto.UserResponse;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    public UserService(UserRepository userRepository, UserProfileRepository userProfileRepository) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    public UserResponse getUser(UUID userId) {
        User user = findUser(userId);
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        return UserResponse.from(user, profile);
    }

    @Transactional
    public UserResponse completeOnboarding(UUID userId, OnboardingRequest request) {
        User user = findUser(userId);
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    UserProfile p = new UserProfile();
                    p.setUser(user);
                    return p;
                });

        if (Boolean.TRUE.equals(profile.getOnboardingCompleted())) {
            throw new BusinessException("Onboarding already completed");
        }

        profile.setFitnessLevel(request.fitnessLevel());
        profile.setGoal(request.goal());
        profile.setAvailableDaysPerWeek(request.availableDaysPerWeek());
        profile.setBodyWeightKg(request.bodyWeightKg());
        profile.setHeightCm(request.heightCm());
        profile.setBirthDate(request.birthDate());
        profile.setOnboardingCompleted(true);

        userProfileRepository.save(profile);
        return UserResponse.from(user, profile);
    }

    @Transactional
    public UserResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = findUser(userId);
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    UserProfile p = new UserProfile();
                    p.setUser(user);
                    return p;
                });

        if (request.name() != null) {
            user.setName(request.name());
            userRepository.save(user);
        }
        if (request.fitnessLevel() != null) profile.setFitnessLevel(request.fitnessLevel());
        if (request.goal() != null) profile.setGoal(request.goal());
        if (request.availableDaysPerWeek() != null) profile.setAvailableDaysPerWeek(request.availableDaysPerWeek());
        if (request.bodyWeightKg() != null) profile.setBodyWeightKg(request.bodyWeightKg());
        if (request.heightCm() != null) profile.setHeightCm(request.heightCm());
        if (request.birthDate() != null) profile.setBirthDate(request.birthDate());

        userProfileRepository.save(profile);
        return UserResponse.from(user, profile);
    }

    private User findUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("User", userId));
    }
}
