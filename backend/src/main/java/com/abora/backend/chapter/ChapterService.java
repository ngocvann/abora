package com.abora.backend.chapter;

import com.abora.backend.auth.AuthenticatedUser;
import com.abora.backend.chapter.dto.ChapterResponse;
import com.abora.backend.chapter.dto.ChapterSummaryResponse;
import com.abora.backend.chapter.dto.CreateChapterRequest;
import com.abora.backend.chapter.dto.ReadChapterResponse;
import com.abora.backend.chapter.dto.UpdateChapterRequest;
import com.abora.backend.common.exception.BadRequestException;
import com.abora.backend.common.exception.ForbiddenException;
import com.abora.backend.common.exception.NotFoundException;
import com.abora.backend.common.exception.NotFoundException;
import com.abora.backend.common.exception.UnauthorizedException;
import com.abora.backend.common.utils.ChapterUtil;
import com.abora.backend.common.utils.SlugUtil;
import com.abora.backend.story.Story;
import com.abora.backend.story.StoryRepository;
import com.abora.backend.story.StoryStatus;
import com.abora.backend.story.StoryVisibility;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChapterService {

    private final ChapterRepository chapterRepository;
    private final StoryRepository storyRepository;
    private final ChapterLikeRepository chapterLikeRepository;
    private final ChapterViewRepository chapterViewRepository;
    private final com.abora.backend.library.ReadingHistoryRepository readingHistoryRepository;
    private final com.abora.backend.user.UserRepository userRepository;
    private final com.abora.backend.notification.NotificationService notificationService;

    private Long getCurrentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser user) {
            return user.getId();
        }
        throw new UnauthorizedException("User not authenticated");
    }

    private Long getCurrentUserIdOptional() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser user) {
            return user.getId();
        }
        return null;
    }

    private Story verifyStoryAuthor(Long storyId) {
        Long userId = getCurrentUserId();
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new NotFoundException("Story not found"));
        if (!story.getAuthor().getId().equals(userId)) {
            throw new ForbiddenException("You do not have permission to modify this story.");
        }
        return story;
    }

    private String generateUniqueSlug(Long storyId, String title, Long excludeId) {
        String baseSlug = SlugUtil.toSlug(title);
        if (baseSlug == null || baseSlug.isEmpty()) {
            baseSlug = "chuong";
        }
        String slug = baseSlug;
        int counter = 1;
        while (true) {
            boolean exists;
            if (excludeId != null) {
                exists = chapterRepository.existsByStoryIdAndSlugAndIdNot(storyId, slug, excludeId);
            } else {
                exists = chapterRepository.existsByStoryIdAndSlug(storyId, slug);
            }
            if (!exists) return slug;
            slug = baseSlug + "-" + counter;
            counter++;
        }
    }

    @Transactional
    public ChapterResponse createChapter(Long storyId, CreateChapterRequest request) {
        Story story = verifyStoryAuthor(storyId);

        if (chapterRepository.existsByStoryIdAndChapterNumber(storyId, request.chapterNumber())) {
            throw new BadRequestException("Chapter number already exists for this story");
        }

        Chapter chapter = new Chapter();
        chapter.setStory(story);
        chapter.setTitle(request.title());
        chapter.setContent(request.content());
        chapter.setChapterNumber(request.chapterNumber());
        chapter.setSlug(generateUniqueSlug(storyId, request.title(), null));
        
        ChapterStatus status;
        try {
            status = ChapterStatus.valueOf(request.status().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status: " + request.status());
        }
        chapter.setStatus(status);
        
        // If transitioning to PUBLISHED for the first time
        if (status == ChapterStatus.PUBLISHED) {
            if (chapter.getPublishedAt() == null) {
                chapter.setPublishedAt(Instant.now());
                sendNewChapterNotifications(story, chapter);
            }
            if (story.getStatus() != StoryStatus.PUBLISHED && story.getStatus() != StoryStatus.COMPLETED) {
                story.setStatus(StoryStatus.PUBLISHED);
            }
        }
        
        int wordCount = ChapterUtil.calculateWordCount(request.content());
        chapter.setWordCount(wordCount);
        chapter.setEstimatedReadingTime(ChapterUtil.calculateEstimatedReadingTime(wordCount));

        chapter = chapterRepository.save(chapter);
        
        // Update story chapter count
        story.setChapterCount(story.getChapterCount() + 1);
        storyRepository.save(story);

        return mapToResponse(chapter);
    }

    @Transactional
    public ChapterResponse updateChapter(Long storyId, Long chapterId, UpdateChapterRequest request) {
        verifyStoryAuthor(storyId);

        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new NotFoundException("Chapter not found"));

        if (!chapter.getStory().getId().equals(storyId)) {
            throw new BadRequestException("Chapter does not belong to this story");
        }

        if (request.title() != null) {
            chapter.setTitle(request.title());
            chapter.setSlug(generateUniqueSlug(storyId, request.title(), chapterId));
        }
        if (request.content() != null) {
            chapter.setContent(request.content());
            int wordCount = ChapterUtil.calculateWordCount(request.content());
            chapter.setWordCount(wordCount);
            chapter.setEstimatedReadingTime(ChapterUtil.calculateEstimatedReadingTime(wordCount));
        }

        if (request.chapterNumber() != null) {
            if (!chapter.getChapterNumber().equals(request.chapterNumber()) &&
                chapterRepository.existsByStoryIdAndChapterNumber(storyId, request.chapterNumber())) {
                throw new BadRequestException("Chapter number already exists for this story");
            }
            chapter.setChapterNumber(request.chapterNumber());
        }

        if (request.status() != null) {
            ChapterStatus status;
            try {
                status = ChapterStatus.valueOf(request.status().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid status: " + request.status());
            }

            Story story = chapter.getStory();
            
            // If transitioning to PUBLISHED
            if (status == ChapterStatus.PUBLISHED) {
                if (chapter.getStatus() != ChapterStatus.PUBLISHED && chapter.getPublishedAt() == null) {
                    chapter.setPublishedAt(Instant.now());
                    sendNewChapterNotifications(story, chapter);
                }
                if (story.getStatus() != StoryStatus.PUBLISHED && story.getStatus() != StoryStatus.COMPLETED) {
                    story.setStatus(StoryStatus.PUBLISHED);
                    storyRepository.save(story);
                }
            }
            
            // If transitioning from PUBLISHED to DRAFT
            if (status == ChapterStatus.DRAFT && chapter.getStatus() == ChapterStatus.PUBLISHED) {
                long publishedCount = chapterRepository.countByStoryIdAndStatus(storyId, ChapterStatus.PUBLISHED);
                if (publishedCount <= 1) {
                    if (story.getStatus() == StoryStatus.PUBLISHED || story.getStatus() == StoryStatus.COMPLETED) {
                        story.setStatus(StoryStatus.DRAFT);
                        storyRepository.save(story);
                    }
                }
            }
            
            chapter.setStatus(status);
        }

        chapter = chapterRepository.save(chapter);
        return mapToResponse(chapter);
    }

    public List<ChapterSummaryResponse> getChaptersForManagement(Long storyId) {
        verifyStoryAuthor(storyId);
        List<Chapter> chapters = chapterRepository.findByStoryIdOrderByChapterNumberAsc(storyId);
        return chapters.stream()
                .map(this::mapToSummaryResponse)
                .collect(Collectors.toList());
    }

    public ChapterResponse getChapterForManagement(Long storyId, Long chapterId) {
        verifyStoryAuthor(storyId);

        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new NotFoundException("Chapter not found"));

        if (!chapter.getStory().getId().equals(storyId)) {
            throw new BadRequestException("Chapter does not belong to this story");
        }

        return mapToResponse(chapter);
    }

    @Transactional
    public ReadChapterResponse readChapter(String slug, String chapterSlug, String ipAddress) {
        Story story = storyRepository.findBySlug(slug)
                .or(() -> {
                    int firstHyphen = slug.indexOf("-");
                    if (firstHyphen > 0) {
                        try {
                            return storyRepository.findById(Long.parseLong(slug.substring(0, firstHyphen)));
                        } catch (NumberFormatException e) {}
                    }
                    try {
                        return storyRepository.findById(Long.parseLong(slug));
                    } catch (NumberFormatException e) {
                        return Optional.empty();
                    }
                })
                .orElseThrow(() -> new NotFoundException("Story not found"));

        Long currentUserId = null;
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser user) {
            currentUserId = user.getId();
        }

        boolean isAuthor = currentUserId != null && story.getAuthor().getId().equals(currentUserId);

        if (story.getVisibility() != StoryVisibility.PUBLIC && !isAuthor) {
            throw new ForbiddenException("Story is not public");
        }

        Chapter chapter;
        if (isAuthor) {
            chapter = chapterRepository.findByStoryIdOrderByChapterNumberAsc(story.getId()).stream()
                    .filter(c -> chapterSlug.equals(c.getSlug()))
                    .findFirst()
                    .orElseThrow(() -> new NotFoundException("Chapter not found"));
        } else {
            chapter = chapterRepository.findByStoryIdAndSlugAndStatus(
                    story.getId(), chapterSlug, ChapterStatus.PUBLISHED)
                    .orElseThrow(() -> new NotFoundException("Chapter not found or not published"));
        }

        // Increase view count for story and chapter (only for non-authors)
        if (!isAuthor) {
            boolean recentlyViewed;
            Instant twentyFourHoursAgo = Instant.now().minus(24, java.time.temporal.ChronoUnit.HOURS);
            
            if (currentUserId != null) {
                recentlyViewed = chapterViewRepository.existsByChapterIdAndUserIdAndViewedAtAfter(chapter.getId(), currentUserId, twentyFourHoursAgo);
            } else {
                recentlyViewed = chapterViewRepository.existsByChapterIdAndIpAddressAndViewedAtAfter(chapter.getId(), ipAddress, twentyFourHoursAgo);
            }

            if (!recentlyViewed) {
                chapter.setViewCount(chapter.getViewCount() + 1);
                chapterRepository.save(chapter);
                story.setViewCount(story.getViewCount() + 1);
                storyRepository.save(story);

                ChapterView view = ChapterView.builder()
                        .chapterId(chapter.getId())
                        .userId(currentUserId)
                        .ipAddress(ipAddress)
                        .viewedAt(Instant.now())
                        .build();
                chapterViewRepository.save(view);
            }
        }

        String prevChapterSlug = null;
        String nextChapterSlug = null;
        if (isAuthor) {
            List<Chapter> allChapters = chapterRepository.findByStoryIdOrderByChapterNumberAsc(story.getId());
            int idx = -1;
            for (int i = 0; i < allChapters.size(); i++) {
                if (allChapters.get(i).getId().equals(chapter.getId())) {
                    idx = i;
                    break;
                }
            }
            prevChapterSlug = (idx > 0) ? allChapters.get(idx - 1).getSlug() : null;
            nextChapterSlug = (idx >= 0 && idx < allChapters.size() - 1) ? allChapters.get(idx + 1).getSlug() : null;
        } else {
            prevChapterSlug = chapterRepository.findTopByStoryIdAndChapterNumberLessThanAndStatusOrderByChapterNumberDesc(
                    story.getId(), chapter.getChapterNumber(), ChapterStatus.PUBLISHED
            ).map(Chapter::getSlug).orElse(null);

            nextChapterSlug = chapterRepository.findTopByStoryIdAndChapterNumberGreaterThanAndStatusOrderByChapterNumberAsc(
                    story.getId(), chapter.getChapterNumber(), ChapterStatus.PUBLISHED
            ).map(Chapter::getSlug).orElse(null);
        }

        Boolean hasLiked = false;
        Integer[] lastReadPosition = new Integer[]{0};
        if (currentUserId != null) {
            hasLiked = chapterLikeRepository.existsByUserIdAndChapterId(currentUserId, chapter.getId());
            readingHistoryRepository.findByUserIdAndStoryId(currentUserId, story.getId())
                    .ifPresent(history -> {
                        if (history.getLastReadChapter() != null && history.getLastReadChapter().getId().equals(chapter.getId())) {
                            lastReadPosition[0] = history.getLastReadPosition() != null ? history.getLastReadPosition() : 0;
                        }
                    });
        }

        return new ReadChapterResponse(
                chapter.getId(),
                story.getId(),
                chapter.getTitle(),
                chapter.getChapterNumber(),
                chapter.getSlug(),
                chapter.getContent(),
                chapter.getWordCount(),
                chapter.getEstimatedReadingTime(),
                chapter.getPublishedAt(),
                prevChapterSlug,
                nextChapterSlug,
                chapter.getViewCount(),
                chapter.getLikeCount(),
                chapter.getCommentCount(),
                hasLiked,
                lastReadPosition[0]
        );
    }

    @Transactional
    public void deleteChapter(Long chapterId) {
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new NotFoundException("Chapter not found"));
        
        verifyStoryAuthor(chapter.getStory().getId());

        if (Boolean.TRUE.equals(chapter.getIsDeleted())) {
            throw new BadRequestException("Chapter already deleted");
        }
        // Soft delete
        chapter.setIsDeleted(true);
        chapterRepository.save(chapter);

        // Decrement story chapter count
        Story story = chapter.getStory();
        story.setChapterCount(story.getChapterCount() - 1);

        // Check if there are any remaining published chapters
        if (chapter.getStatus() == ChapterStatus.PUBLISHED) {
            long publishedCount = chapterRepository.countByStoryIdAndStatus(story.getId(), ChapterStatus.PUBLISHED);
            if (publishedCount == 0) {
                if (story.getStatus() == StoryStatus.PUBLISHED || story.getStatus() == StoryStatus.COMPLETED) {
                    story.setStatus(StoryStatus.DRAFT);
                }
            }
        }

        storyRepository.save(story);

        // Re-index remaining chapters
        List<Chapter> remaining = chapterRepository.findByStoryIdOrderByChapterNumberAsc(story.getId());
        int number = 1;
        for (Chapter ch : remaining) {
            if (!Boolean.TRUE.equals(ch.getIsDeleted())) {
                ch.setChapterNumber(number++);
                chapterRepository.save(ch);
            }
        }
    }

    @Transactional
    public void reorderChapters(Long storyId, List<Long> orderedIds) {
        verifyStoryAuthor(storyId);
        List<Chapter> chapters = chapterRepository.findByStoryIdOrderByChapterNumberAsc(storyId);
        if (chapters.size() != orderedIds.size()) {
            throw new BadRequestException("Chapter list size mismatch");
        }
        // Map for quick lookup
        java.util.Map<Long, Chapter> map = new java.util.HashMap<>();
        for (Chapter c : chapters) {
            map.put(c.getId(), c);
        }
        int index = 1;
        for (Long id : orderedIds) {
            Chapter c = map.get(id);
            if (c == null) {
                throw new BadRequestException("Chapter ID " + id + " does not belong to story");
            }
            c.setChapterNumber(index++);
            chapterRepository.save(c);
        }
    }

    private ChapterResponse mapToResponse(Chapter chapter) {
        return new ChapterResponse(
                chapter.getId(),
                chapter.getStory().getId(),
                chapter.getTitle(),
                chapter.getChapterNumber(),
                chapter.getSlug(),
                chapter.getContent(),
                chapter.getStatus().name(),
                chapter.getWordCount(),
                chapter.getEstimatedReadingTime(),
                chapter.getPublishedAt(),
                chapter.getCreatedAt(),
                chapter.getUpdatedAt()
        );
    }

    private ChapterSummaryResponse mapToSummaryResponse(Chapter chapter) {
        return new ChapterSummaryResponse(
                chapter.getId(),
                chapter.getStory().getId(),
                chapter.getTitle(),
                chapter.getChapterNumber(),
                chapter.getSlug(),
                chapter.getStatus().name(),
                chapter.getWordCount(),
                chapter.getEstimatedReadingTime(),
                chapter.getPublishedAt(),
                chapter.getCreatedAt(),
                chapter.getUpdatedAt(),
                chapter.getViewCount(),
                chapter.getLikeCount(),
                chapter.getCommentCount()
        );
    }

    @Transactional
    public void likeChapter(Long chapterId) {
        Long userId = getCurrentUserId();
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new NotFoundException("Chapter not found"));

        if (chapterLikeRepository.existsByUserIdAndChapterId(userId, chapterId)) {
            throw new BadRequestException("You have already liked this chapter");
        }

        ChapterLike like = new ChapterLike();
        like.setUser(userRepository.getReferenceById(userId));
        like.setChapter(chapter);
        chapterLikeRepository.save(like);

        chapter.setLikeCount(chapter.getLikeCount() + 1);
        chapterRepository.save(chapter);

        Story story = chapter.getStory();
        story.setFavoriteCount(story.getFavoriteCount() + 1);
        storyRepository.save(story);
    }

    @Transactional
    public void unlikeChapter(Long chapterId) {
        Long userId = getCurrentUserId();
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new NotFoundException("Chapter not found"));

        if (!chapterLikeRepository.existsByUserIdAndChapterId(userId, chapterId)) {
            throw new BadRequestException("You have not liked this chapter");
        }

        chapterLikeRepository.deleteByUserIdAndChapterId(userId, chapterId);

        if (chapter.getLikeCount() > 0) {
            chapter.setLikeCount(chapter.getLikeCount() - 1);
            chapterRepository.save(chapter);
        }

        Story story = chapter.getStory();
        if (story.getFavoriteCount() > 0) {
            story.setFavoriteCount(story.getFavoriteCount() - 1);
            storyRepository.save(story);
        }
    }

    private void sendNewChapterNotifications(Story story, Chapter chapter) {
        Long authorId = story.getAuthor().getId();
        List<com.abora.backend.library.ReadingHistory> histories = readingHistoryRepository.findAllByStoryId(story.getId());
        String targetUrl = "/story/" + story.getSlug() + "/" + chapter.getSlug();
        String message = "Truyện \"" + story.getTitle() + "\" vừa cập nhật chương mới: " + chapter.getTitle();

        for (com.abora.backend.library.ReadingHistory rh : histories) {
            Long readerId = rh.getUser().getId();
            if (!readerId.equals(authorId)) {
                notificationService.createNotification(
                        readerId,
                        authorId,
                        com.abora.backend.notification.NotificationType.NEW_CHAPTER,
                        "CHAPTER",
                        chapter.getId(),
                        message,
                        targetUrl
                );
            }
        }
    }
}
