package com.abora.backend.user;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    /** NULL nếu user đăng ký qua OAuth2 (Google, etc.) */
    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private UserStatus status;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified;

    /** Tên provider: "GOOGLE", "FACEBOOK", ... (null nếu đăng ký thường) */
    @Column(name = "oauth_provider", length = 30)
    private String oauthProvider;

    /** ID từ provider (Google sub, Facebook id, ...) */
    @Column(name = "oauth_provider_id", length = 255)
    private String oauthProviderId;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private Instant updatedAt;

    @Column(name = "banned_until")
    private Instant bannedUntil;

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /** True nếu tài khoản đã thiết lập mật khẩu (không phải OAuth2-only) */
    public boolean hasPassword() {
        return this.passwordHash != null && !this.passwordHash.isBlank();
    }

    /** True nếu tài khoản được liên kết với OAuth2 provider */
    public boolean isOAuthUser() {
        return this.oauthProvider != null;
    }
}