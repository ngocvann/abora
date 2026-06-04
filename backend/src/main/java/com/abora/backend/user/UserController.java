package com.abora.backend.user;

import com.abora.backend.auth.AuthenticatedUser;
import com.abora.backend.common.dto.MessageResponse;
import com.abora.backend.story.StoryService;
import com.abora.backend.story.dto.StoryResponse;
import com.abora.backend.user.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final StoryService storyService;

    @GetMapping("/{id}")
    public ResponseEntity<UserProfileResponse> getPublicProfile(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        Long currentUserId = (authenticatedUser != null) ? authenticatedUser.getId() : null;
        return ResponseEntity.ok(userService.getPublicProfile(id, currentUserId));
    }

    @GetMapping("/by-username/{username}")
    public ResponseEntity<UserProfileResponse> getPublicProfileByUsername(
            @PathVariable("username") String username,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        Long currentUserId = (authenticatedUser != null) ? authenticatedUser.getId() : null;
        return ResponseEntity.ok(userService.getPublicProfileByUsername(username, currentUserId));
    }

    @GetMapping("/{id}/stories")
    public ResponseEntity<List<StoryResponse>> getStoriesByAuthorId(@PathVariable("id") Long id) {
        return ResponseEntity.ok(storyService.getStoriesByAuthorId(id));
    }

    @GetMapping("/profile")
    public MyProfileResponse getProfile(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser) {
        return userService.getMyProfile(authenticatedUser);
    }

    @PutMapping("/profile")
    public MyProfileResponse updateProfile(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestBody UpdateProfileRequest request) {
        return userService.updateProfile(authenticatedUser, request);
    }

    @PostMapping("/profile/avatar")
    public MyProfileResponse updateAvatar(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestParam("file") MultipartFile file) {
        return userService.updateAvatar(authenticatedUser, file);
    }

    @PutMapping("/settings/username")
    public MyProfileResponse changeUsername(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestBody ChangeUsernameRequest request) {
        return userService.changeUsername(authenticatedUser, request);
    }

    @PutMapping("/settings/password")
    public ResponseEntity<MessageResponse> changePassword(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(authenticatedUser, request);
        return ResponseEntity.ok(new MessageResponse("Mật khẩu đã được cập nhật thành công."));
    }
}
