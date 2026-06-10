package com.abora.backend.community;

import com.abora.backend.auth.AuthenticatedUser;
import com.abora.backend.common.exception.ForbiddenException;
import com.abora.backend.common.exception.NotFoundException;
import com.abora.backend.library.ReadingHistory;
import com.abora.backend.library.ReadingHistoryRepository;
import com.abora.backend.library.ReadingStatus;
import com.abora.backend.story.Story;
import com.abora.backend.story.StoryRepository;
import com.abora.backend.user.User;
import com.abora.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.abora.backend.notification.NotificationService;
import com.abora.backend.notification.NotificationType;

@Service
@RequiredArgsConstructor
public class InteractionService {

    private final StoryFollowRepository storyFollowRepository;
    private final ReadingHistoryRepository readingHistoryRepository;
    private final StoryRepository storyRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public void toggleFavorite(Long storyId, boolean isFavorite) {
        Long userId = getCurrentUserId();
        Story story = getStory(storyId);

        ReadingHistory history = readingHistoryRepository.findByUserIdAndStoryId(userId, storyId)
                .orElseGet(() -> {
                    ReadingHistory newHistory = new ReadingHistory();
                    newHistory.setUser(userRepository.getReferenceById(userId));
                    newHistory.setStory(story);
                    newHistory.setStatus(ReadingStatus.READ_LATER);
                    return newHistory;
                });
                
        boolean wasFavorite = history.isFavorite();
        history.setFavorite(isFavorite);
        readingHistoryRepository.save(history);

        if (wasFavorite != isFavorite) {
            if (isFavorite) {
                story.setFavoriteCount(story.getFavoriteCount() + 1);
            } else {
                story.setFavoriteCount(Math.max(0, story.getFavoriteCount() - 1));
            }
            storyRepository.save(story);
        }
    }

    @Transactional
    public void toggleFollow(Long storyId, boolean isFollow) {
        Long userId = getCurrentUserId();
        Story story = getStory(storyId);

        boolean exists = storyFollowRepository.existsByUserIdAndStoryId(userId, storyId);

        if (isFollow && !exists) {
            StoryFollow follow = new StoryFollow();
            follow.setUserId(userId);
            follow.setStoryId(storyId);
            storyFollowRepository.save(follow);
            
            story.setFollowCount(story.getFollowCount() + 1);
            storyRepository.save(story);

            // Gửi thông báo cho tác giả truyện
            User actor = userRepository.getReferenceById(userId);
            Long authorId = story.getAuthor().getId();
            if (!userId.equals(authorId)) {
                notificationService.createNotification(
                        authorId,
                        userId,
                        NotificationType.LIKE_STORY,
                        "STORY",
                        storyId,
                        actor.getDisplayName() + " đã yêu thích (tim) truyện \"" + story.getTitle() + "\" của bạn",
                        "/story/" + story.getId() + "-" + story.getSlug()
                );
            }
        } else if (!isFollow && exists) {
            storyFollowRepository.deleteByUserIdAndStoryId(userId, storyId);
            
            story.setFollowCount(Math.max(0, story.getFollowCount() - 1));
            storyRepository.save(story);
        }
    }

    @Transactional(readOnly = true)
    public boolean checkFollowStatus(Long storyId) {
        try {
            Long userId = getCurrentUserId();
            return storyFollowRepository.existsByUserIdAndStoryId(userId, storyId);
        } catch (ForbiddenException e) {
            return false;
        }
    }

    private Story getStory(Long storyId) {
        return storyRepository.findById(storyId)
                .orElseThrow(() -> new NotFoundException("Story not found"));
    }

    private Long getCurrentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser authUser) {
            return authUser.getId();
        }
        throw new ForbiddenException("User not authenticated");
    }
}
