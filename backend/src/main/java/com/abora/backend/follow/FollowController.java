package com.abora.backend.follow;

import com.abora.backend.auth.AuthenticatedUser;
import com.abora.backend.common.dto.MessageResponse;
import com.abora.backend.user.dto.UserSimpleResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    @PostMapping("/{id}/follow")
    public ResponseEntity<MessageResponse> follow(
            @PathVariable("id") Long followingId,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        followService.followUser(authenticatedUser.getId(), followingId);
        return ResponseEntity.ok(new MessageResponse("Theo dõi người dùng thành công."));
    }

    @DeleteMapping("/{id}/unfollow")
    public ResponseEntity<MessageResponse> unfollow(
            @PathVariable("id") Long followingId,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        followService.unfollowUser(authenticatedUser.getId(), followingId);
        return ResponseEntity.ok(new MessageResponse("Hủy theo dõi người dùng thành công."));
    }

    @GetMapping("/{id}/followers")
    public ResponseEntity<List<UserSimpleResponse>> getFollowers(@PathVariable("id") Long userId) {
        return ResponseEntity.ok(followService.getFollowers(userId));
    }

    @GetMapping("/{id}/following")
    public ResponseEntity<List<UserSimpleResponse>> getFollowing(@PathVariable("id") Long userId) {
        return ResponseEntity.ok(followService.getFollowing(userId));
    }

    @GetMapping("/{id}/follow-status")
    public ResponseEntity<Boolean> getFollowStatus(
            @PathVariable("id") Long followingId,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        if (authenticatedUser == null) {
            return ResponseEntity.ok(false);
        }
        return ResponseEntity.ok(followService.isFollowing(authenticatedUser.getId(), followingId));
    }

    @PostMapping("/{id}/mute-notifications")
    public ResponseEntity<java.util.Map<String, Object>> toggleMuteNotifications(
            @PathVariable("id") Long followingId,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        boolean muted = followService.toggleMuteNotifications(authenticatedUser.getId(), followingId);
        return ResponseEntity.ok(java.util.Map.of("muted", muted));
    }

    @GetMapping("/{id}/mute-status")
    public ResponseEntity<java.util.Map<String, Object>> getMuteStatus(
            @PathVariable("id") Long followingId,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        if (authenticatedUser == null) return ResponseEntity.ok(java.util.Map.of("muted", false));
        boolean muted = followService.getMuteStatus(authenticatedUser.getId(), followingId);
        return ResponseEntity.ok(java.util.Map.of("muted", muted));
    }
}
