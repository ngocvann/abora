package com.abora.backend.admin;

import com.abora.backend.user.User;
import com.abora.backend.user.UserRole;
import com.abora.backend.user.UserStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class AdminUserResponse {
    private Long id;
    private String email;
    private String username;
    private String displayName;
    private String avatarUrl;
    private UserRole role;
    private UserStatus status;
    private boolean emailVerified;
    private Instant lastLoginAt;
    private Instant createdAt;

    public static AdminUserResponse fromUser(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .status(user.getStatus())
                .emailVerified(user.isEmailVerified())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
