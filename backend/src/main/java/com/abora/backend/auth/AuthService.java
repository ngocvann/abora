package com.abora.backend.auth;

import com.abora.backend.auth.dto.*;
import com.abora.backend.common.dto.MessageResponse;
import com.abora.backend.common.exception.BadRequestException;
import com.abora.backend.common.exception.NotFoundException;
import com.abora.backend.common.exception.UnauthorizedException;
import com.abora.backend.user.User;
import com.abora.backend.user.UserRepository;
import com.abora.backend.user.UserRole;
import com.abora.backend.user.UserStatus;
import com.abora.backend.user.UsernameValidator;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthTokenService authTokenService;
    private final EmailSender emailSender;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Value("${app.google.client-id}")
    private String googleClientId;

    @Transactional
    public MessageResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();

        String username;
        if (request.username() == null || request.username().trim().isEmpty()) {
            username = generateUniqueUsername("user");
        } else {
            username = request.username().trim();
            UsernameValidator.validateUsername(username);
            if (userRepository.existsByUsername(username)) {
                throw new BadRequestException("Username '" + username + "' đã được sử dụng.");
            }
        }

        String displayName = (request.displayName() == null || request.displayName().trim().isEmpty())
                ? username
                : request.displayName().trim();

        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email này đã được đăng ký.");
        }

        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setUsername(username);
        user.setDisplayName(displayName);
        user.setRole(UserRole.USER);
        user.setStatus(UserStatus.PENDING_VERIFICATION);
        user.setEmailVerified(false);

        userRepository.save(user);
        sendVerificationEmail(user);

        return new MessageResponse(
            "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản trước khi đăng nhập."
        );
    }

    @Transactional
    public MessageResponse verifyEmail(VerifyEmailRequest request) {
        String tokenHash = authTokenService.sha256(request.token());

        EmailVerificationToken token = emailVerificationTokenRepository
                .findByUser_EmailAndTokenHashAndUsedAtIsNull(request.email().trim().toLowerCase(), tokenHash)
                .orElseThrow(() -> new BadRequestException(
                    "Mã OTP không hợp lệ hoặc đã được sử dụng."
                ));

        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException(
                "Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại email xác thực."
            );
        }

        token.setUsedAt(Instant.now());

        User user = token.getUser();
        user.setEmailVerified(true);
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);

        return new MessageResponse("Xác thực email thành công! Bây giờ bạn có thể đăng nhập.");
    }

    public AuthResponse login(LoginRequest request) {
        String authKey = request.email().trim();
        User user = getUserByEmailOrUsername(authKey);

        checkAccountStatus(user);

        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(authKey, request.password())
            );
        } catch (BadCredentialsException e) {
            throw new UnauthorizedException("Email/Username hoặc mật khẩu không đúng.");
        } catch (DisabledException e) {
            throw new UnauthorizedException("Tài khoản chưa được kích hoạt. Vui lòng xác thực email.");
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse loginWithGoogle(OAuth2LoginRequest request) {
        Map<String, Object> googlePayload = verifyGoogleToken(request.idToken());

        String googleId   = (String) googlePayload.get("sub");
        String email      = (String) googlePayload.get("email");
        String name       = (String) googlePayload.get("name");
        String pictureUrl = (String) googlePayload.get("picture");

        if (googleId == null || email == null) {
            throw new BadRequestException("Token Google không hợp lệ hoặc thiếu thông tin.");
        }

        User user = userRepository
                .findByOauthProviderAndOauthProviderId("GOOGLE", googleId)
                .orElseGet(() -> {
                    Optional<User> existingByEmail = userRepository.findByEmail(email.toLowerCase());
                    if (existingByEmail.isPresent()) {
                        User existing = existingByEmail.get();
                        existing.setOauthProvider("GOOGLE");
                        existing.setOauthProviderId(googleId);
                        if (!existing.isEmailVerified()) {
                            existing.setEmailVerified(true);
                            existing.setStatus(UserStatus.ACTIVE);
                        }
                        return existing;
                    }
                    return createOAuthUser("GOOGLE", googleId, email, name, pictureUrl);
                });

        if (user.getStatus() == UserStatus.SUSPENDED || user.getStatus() == UserStatus.BANNED) {
            throw new UnauthorizedException("Tài khoản của bạn đã bị khóa.");
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        return buildAuthResponse(user);
    }

    @Transactional
    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        String email = request.email().trim().toLowerCase();
        userRepository.findByEmail(email).ifPresent(user -> {
            if (!user.hasPassword()) {
                log.warn("ForgotPassword: User {} dùng OAuth2, không có password để reset", email);
                return;
            }
            passwordResetTokenRepository.invalidateAllForUser(user.getId());

            String rawToken  = authTokenService.generateRawToken();
            String tokenHash = authTokenService.sha256(rawToken);

            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setUser(user);
            resetToken.setTokenHash(tokenHash);
            resetToken.setExpiresAt(Instant.now().plus(1, ChronoUnit.HOURS));
            passwordResetTokenRepository.save(resetToken);

            String resetUrl = "http://localhost:5173/reset-password?token=" + rawToken;
            emailSender.sendPasswordResetEmail(user.getEmail(), resetUrl);
        });
        return new MessageResponse("Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.");
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        String tokenHash = authTokenService.sha256(request.token());

        PasswordResetToken resetToken = passwordResetTokenRepository
                .findByTokenHashAndUsedAtIsNull(tokenHash)
                .orElseThrow(() -> new BadRequestException(
                    "Token không hợp lệ hoặc đã được sử dụng."
                ));

        if (resetToken.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException(
                "Token đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới."
            );
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));

        resetToken.setUsedAt(Instant.now());
        passwordResetTokenRepository.save(resetToken);

        return new MessageResponse("Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập.");
    }

    private User getUserByEmailOrUsername(String input) {
        if (input.contains("@")) {
            return userRepository.findByEmail(input.toLowerCase())
                    .orElseThrow(() -> new UnauthorizedException(
                        "Email/Username hoặc mật khẩu không đúng."
                    ));
        } else {
            return userRepository.findByUsername(input)
                    .orElseThrow(() -> new UnauthorizedException(
                        "Email/Username hoặc mật khẩu không đúng."
                    ));
        }
    }

    private void checkAccountStatus(User user) {
        if (user.getStatus() == UserStatus.PENDING_VERIFICATION || !user.isEmailVerified()) {
            throw new BadRequestException(
                "Tài khoản chưa được xác thực. Vui lòng kiểm tra email và nhập mã OTP để xác thực."
            );
        }
        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new UnauthorizedException("Tài khoản của bạn đã bị đình chỉ tạm thời.");
        }
        if (user.getStatus() == UserStatus.BANNED) {
            throw new UnauthorizedException("Tài khoản của bạn đã bị cấm vĩnh viễn.");
        }
    }

    private User createOAuthUser(String provider, String providerId,
                                 String email, String name, String pictureUrl) {
        User user = new User();
        user.setEmail(email.toLowerCase());
        user.setPasswordHash(null);
        user.setUsername(generateUniqueUsername(sanitizeName(name)));
        user.setDisplayName(name != null ? name : email);
        user.setAvatarUrl(pictureUrl);
        user.setRole(UserRole.USER);
        user.setStatus(UserStatus.ACTIVE);
        user.setEmailVerified(true);
        return userRepository.save(user);
    }

    private String sanitizeName(String name) {
        if (name == null || name.isBlank()) return "user";
        return name.toLowerCase()
                   .replaceAll("[^a-z0-9]", "_")
                   .replaceAll("_{2,}", "_")
                   .replaceAll("^_|_$", "");
    }

    private String generateUniqueUsername(String base) {
        String candidate = base.isBlank() ? "user" : base;
        if (candidate.length() > 30) candidate = candidate.substring(0, 30);

        if (!userRepository.existsByUsername(candidate)) return candidate;

        for (int attempt = 0; attempt < 10; attempt++) {
            String withSuffix = candidate + "_" + UUID.randomUUID().toString().substring(0, 6);
            if (!userRepository.existsByUsername(withSuffix)) return withSuffix;
        }
        return "user_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
    }

    private Map<String, Object> verifyGoogleToken(String idToken) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken googleIdToken = verifier.verify(idToken);
            if (googleIdToken == null) {
                log.warn("Google ID Token verification failed: token is null");
                throw new BadRequestException("Token Google không hợp lệ hoặc đã hết hạn.");
            }

            GoogleIdToken.Payload payload = googleIdToken.getPayload();
            String sub = payload.getSubject();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String picture = (String) payload.get("picture");

            if (sub == null || email == null) {
                throw new BadRequestException("Token Google không hợp lệ hoặc thiếu thông tin email/ID.");
            }

            return Map.of(
                "sub", sub,
                "email", email,
                "name", name != null ? name : "",
                "picture", picture != null ? picture : ""
            );
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Lỗi verify Google token: {}", e.getMessage());
            throw new BadRequestException("Không thể xác thực token Google. Chi tiết: " + e.getMessage());
        }
    }

    private void sendVerificationEmail(User user) {
        String otp = authTokenService.generateOtp();
        String tokenHash = authTokenService.sha256(otp);

        EmailVerificationToken verificationToken = new EmailVerificationToken();
        verificationToken.setUser(user);
        verificationToken.setTokenHash(tokenHash);
        verificationToken.setExpiresAt(Instant.now().plus(24, ChronoUnit.HOURS));
        emailVerificationTokenRepository.save(verificationToken);

        emailSender.sendVerificationEmail(user.getEmail(), otp);
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        return new AuthResponse(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getDisplayName(),
                user.getRole().name(),
                accessToken
        );
    }
}
