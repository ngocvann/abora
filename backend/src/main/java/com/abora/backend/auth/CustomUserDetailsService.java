package com.abora.backend.auth;

import com.abora.backend.common.exception.NotFoundException;
import com.abora.backend.user.User;
import com.abora.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Được gọi bởi Spring Security AuthenticationManager.
     * Chấp nhận cả email lẫn username.
     */
    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        User user = resolveUser(usernameOrEmail);
        return new AuthenticatedUser(user);
    }

    /** Dùng trong JwtAuthenticationFilter để load user từ userId trong JWT. */
    public User loadDomainUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    /**
     * Tìm user theo email nếu input chứa '@', ngược lại tìm theo username.
     */
    private User resolveUser(String usernameOrEmail) {
        if (usernameOrEmail == null || usernameOrEmail.isBlank()) {
            throw new UsernameNotFoundException("Thông tin đăng nhập không hợp lệ");
        }

        String trimmed = usernameOrEmail.trim();

        if (trimmed.contains("@")) {
            return userRepository.findByEmail(trimmed.toLowerCase())
                    .orElseThrow(() -> new UsernameNotFoundException("Email hoặc mật khẩu không đúng"));
        } else {
            return userRepository.findByUsername(trimmed)
                    .orElseThrow(() -> new UsernameNotFoundException("Email hoặc mật khẩu không đúng"));
        }
    }
}