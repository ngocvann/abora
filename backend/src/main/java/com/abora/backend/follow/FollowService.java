package com.abora.backend.follow;

import com.abora.backend.common.exception.BadRequestException;
import com.abora.backend.common.exception.NotFoundException;
import com.abora.backend.user.User;
import com.abora.backend.user.UserRepository;
import com.abora.backend.notification.NotificationService;
import com.abora.backend.notification.NotificationType;
import com.abora.backend.user.dto.UserSimpleResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final UserFollowRepository userFollowRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public void followUser(Long followerId, Long followingId) {
        if (followerId.equals(followingId)) {
            throw new BadRequestException("Bạn không thể tự theo dõi chính mình.");
        }

        User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new NotFoundException("Người theo dõi không tồn tại."));
        User following = userRepository.findById(followingId)
                .orElseThrow(() -> new NotFoundException("Người được theo dõi không tồn tại."));

        if (userFollowRepository.existsByFollowerIdAndFollowingId(followerId, followingId)) {
            return; // Đã follow rồi thì bỏ qua
        }

        UserFollow follow = new UserFollow(follower, following);
        userFollowRepository.save(follow);

        // Tạo thông báo
        notificationService.createNotification(
            followingId,
            followerId,
            NotificationType.NEW_FOLLOWER,
            "USER",
            followerId,
            follower.getDisplayName() + " đã bắt đầu theo dõi bạn.",
            "/" + follower.getUsername()
        );
    }

    @Transactional
    public void unfollowUser(Long followerId, Long followingId) {
        userFollowRepository.findByFollowerIdAndFollowingId(followerId, followingId)
                .ifPresent(userFollowRepository::delete);
    }

    public List<UserSimpleResponse> getFollowers(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new NotFoundException("Người dùng không tồn tại.");
        }
        return userFollowRepository.findFollowersByFollowingId(userId)
                .stream()
                .map(UserSimpleResponse::fromUser)
                .collect(Collectors.toList());
    }

    public List<UserSimpleResponse> getFollowing(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new NotFoundException("Người dùng không tồn tại.");
        }
        return userFollowRepository.findFollowingByFollowerId(userId)
                .stream()
                .map(UserSimpleResponse::fromUser)
                .collect(Collectors.toList());
    }

    public boolean isFollowing(Long followerId, Long followingId) {
        return userFollowRepository.existsByFollowerIdAndFollowingId(followerId, followingId);
    }

    @Transactional
    public boolean toggleMuteNotifications(Long followerId, Long followingId) {
        UserFollow follow = userFollowRepository.findByFollowerIdAndFollowingId(followerId, followingId)
                .orElseThrow(() -> new com.abora.backend.common.exception.BadRequestException("Bạn chưa theo dõi người dùng này."));
        follow.setMutedNotifications(!follow.isMutedNotifications());
        userFollowRepository.save(follow);
        return follow.isMutedNotifications();
    }

    public boolean getMuteStatus(Long followerId, Long followingId) {
        return userFollowRepository.findByFollowerIdAndFollowingId(followerId, followingId)
                .map(UserFollow::isMutedNotifications)
                .orElse(false);
    }
}
