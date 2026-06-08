package com.abora.backend.user;

import com.abora.backend.auth.AuthenticatedUser;
import com.abora.backend.common.exception.BadRequestException;
import com.abora.backend.common.exception.NotFoundException;
import com.abora.backend.common.storage.StorageService;
import com.abora.backend.follow.UserFollowRepository;
import com.abora.backend.user.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final StorageService storageService;
    private final PasswordEncoder passwordEncoder;
    private final UserFollowRepository userFollowRepository;

    public MyProfileResponse getMyProfile(AuthenticatedUser authenticatedUser) {
        User user = findUser(authenticatedUser.getId());
        return toProfileResponse(user);
    }

    public UserProfileResponse getPublicProfile(Long id, Long currentUserId) {
        User user = findUser(id);
        long followersCount = userFollowRepository.countByFollowingId(id);
        long followingCount = userFollowRepository.countByFollowerId(id);
        boolean isFollowing = false;
        if (currentUserId != null) {
            isFollowing = userFollowRepository.existsByFollowerIdAndFollowingId(currentUserId, id);
        }
        return new UserProfileResponse(
            user.getId(),
            user.getUsername(),
            user.getDisplayName(),
            user.getBio(),
            user.getAvatarUrl(),
            followersCount,
            followingCount,
            isFollowing,
            user.getCreatedAt()
        );
    }

    public UserProfileResponse getPublicProfileByUsername(String username, Long currentUserId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("Người dùng không tồn tại."));
        return getPublicProfile(user.getId(), currentUserId);
    }

    @Transactional
    public MyProfileResponse updateProfile(AuthenticatedUser authenticatedUser,
                                           UpdateProfileRequest request) {
        User user = findUser(authenticatedUser.getId());
        user.setDisplayName(request.getDisplayName());
        user.setBio(request.getBio());
        return toProfileResponse(userRepository.save(user));
    }

    @Transactional
    public MyProfileResponse updateAvatar(AuthenticatedUser authenticatedUser,
                                          MultipartFile file) {
        User user = findUser(authenticatedUser.getId());
        String avatarUrl = storageService.store(file, "avatars");
        user.setAvatarUrl(avatarUrl);
        return toProfileResponse(userRepository.save(user));
    }

    @Transactional
    public MyProfileResponse changeUsername(AuthenticatedUser authenticatedUser,
                                            ChangeUsernameRequest request) {
        User user = findUser(authenticatedUser.getId());
        String newUsername = request.newUsername().trim();

        if (newUsername.equalsIgnoreCase(user.getUsername())) {
            return toProfileResponse(user);
        }

        if (userRepository.existsByUsername(newUsername)) {
            throw new BadRequestException(
                "Username '" + newUsername + "' đã được sử dụng. Vui lòng chọn tên khác."
            );
        }

        user.setUsername(newUsername);
        return toProfileResponse(userRepository.save(user));
    }

    @Transactional
    public void changePassword(AuthenticatedUser authenticatedUser,
                               ChangePasswordRequest request) {
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new BadRequestException("Mật khẩu xác nhận không khớp.");
        }

        User user = findUser(authenticatedUser.getId());

        if (user.hasPassword()) {
            if (request.currentPassword() == null || request.currentPassword().isBlank()) {
                throw new BadRequestException(
                    "Vui lòng nhập mật khẩu hiện tại để xác nhận."
                );
            }
            if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
                throw new BadRequestException("Mật khẩu hiện tại không đúng.");
            }
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Người dùng không tồn tại."));
    }

    private MyProfileResponse toProfileResponse(User user) {
        return new MyProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getDisplayName(),
                user.getBio(),
                user.getAvatarUrl(),
                user.getRole().name(),
                user.isEmailVerified(),
                user.hasPassword(),
                user.getOauthProvider()
        );
    }

    @Transactional(readOnly = true)
    public java.util.List<UserSimpleResponse> searchUsers(String query) {
        if (query == null || query.trim().isEmpty()) {
            return java.util.List.of();
        }
        String cleanQuery = query.trim();
        org.springframework.data.domain.PageRequest pageRequest = org.springframework.data.domain.PageRequest.of(0, 10);
        return userRepository.searchUsers(cleanQuery, pageRequest)
                .stream()
                .map(UserSimpleResponse::fromUser)
                .toList();
    }
}
