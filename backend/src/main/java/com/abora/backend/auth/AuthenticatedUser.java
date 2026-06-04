package com.abora.backend.auth;

import com.abora.backend.user.User;
import com.abora.backend.user.UserRole;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Getter
public class AuthenticatedUser implements UserDetails {

    private final Long id;
    private final String email;
    /** Có thể null nếu user đăng ký qua OAuth2 */
    private final String passwordHash;
    private final UserRole role;
    private final boolean enabled;

    public AuthenticatedUser(User user) {
        this.id           = user.getId();
        this.email        = user.getEmail();
        this.passwordHash = user.getPasswordHash(); // null-safe
        this.role         = user.getRole();
        this.enabled      = user.isEmailVerified()
                         && user.getStatus() != null
                         && user.getStatus().name().equals("ACTIVE");
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    /**
     * Spring Security cần giá trị non-null ở đây khi chạy qua DaoAuthenticationProvider.
     * Với OAuth2 user (passwordHash = null), chuỗi sentinel này đảm bảo
     * quá trình authenticate() của Spring không bị NPE —
     * nhưng nó sẽ không bao giờ khớp với bất kỳ mật khẩu nào người dùng nhập.
     */
    @Override
    public String getPassword() {
        return passwordHash != null ? passwordHash : "";
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    @Override
    public boolean isAccountNonExpired() { return true; }
    @Override
    public boolean isAccountNonLocked() { return true; }
    @Override
    public boolean isCredentialsNonExpired() { return true; }

}