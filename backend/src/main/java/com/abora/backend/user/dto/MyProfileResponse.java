package com.abora.backend.user.dto;

public record MyProfileResponse(
        Long id,
        String email,
        String username,
        String displayName,
        String bio,
        String avatarUrl,
        String role,
        boolean emailVerified,
        /** True nếu account đã có mật khẩu (false với OAuth2-only user) */
        boolean hasPassword,
        /** Provider OAuth2 liên kết: "GOOGLE", null nếu đăng ký thường */
        String oauthProvider
) {}
