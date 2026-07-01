package com.treinus.achievements;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface UserAchievementRepository extends JpaRepository<UserAchievement, UUID> {

    List<UserAchievement> findByUserId(UUID userId);

    boolean existsByUserIdAndCode(UUID userId, String code);

    @Modifying
    @Query("UPDATE UserAchievement ua SET ua.acknowledged = true " +
            "WHERE ua.user.id = :userId AND ua.acknowledged = false")
    void acknowledgeAllForUser(@Param("userId") UUID userId);
}
