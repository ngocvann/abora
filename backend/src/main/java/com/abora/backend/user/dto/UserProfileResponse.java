package com.abora.backend.user.dto;

import java.time.Instant;

public record UserProfileResponse(
    Long id,
    String username,
    String displayName,
    String bio,
    String avatarUrl,
    long followersCount,
    long followingCount,
    boolean isFollowing,
    Instant createdAt
) {}
