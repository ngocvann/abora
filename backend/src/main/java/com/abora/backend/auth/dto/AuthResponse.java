package com.abora.backend.auth.dto;

public record AuthResponse(
        Long userId,
        String email,
        String username,
        String displayName,
        String role,
        String avatarUrl,
        String accessToken
) {
}