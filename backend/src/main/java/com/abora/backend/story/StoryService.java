package com.abora.backend.story;

import com.abora.backend.auth.AuthenticatedUser;
import com.abora.backend.chapter.Chapter;
import com.abora.backend.chapter.ChapterRepository;
import com.abora.backend.chapter.ChapterStatus;
import com.abora.backend.common.exception.BadRequestException;
import com.abora.backend.common.exception.ForbiddenException;
import com.abora.backend.common.exception.NotFoundException;
import com.abora.backend.common.storage.StorageService;
import com.abora.backend.common.utils.SlugUtil;
import com.abora.backend.follow.UserFollowRepository;
import com.abora.backend.library.ReadingHistoryRepository;
import com.abora.backend.notification.NotificationService;
import com.abora.backend.notification.NotificationType;
import com.abora.backend.story.dto.*;
import com.abora.backend.user.User;
import com.abora.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StoryService {

    private final StoryRepository storyRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;
    private final ChapterRepository chapterRepository;
    private final ReadingHistoryRepository readingHistoryRepository;
    private final SearchHistoryRepository searchHistoryRepository;
    private final NotificationService notificationService;
    private final UserFollowRepository userFollowRepository;

    @Transactional
    public StoryResponse createStory(CreateStoryRequest request) {
        Long authorId = getCurrentUserId();
        User author = userRepository.getReferenceById(authorId);

        String baseSlug = SlugUtil.toSlug(request.title());
        String slug = baseSlug;
        
        if (storyRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + UUID.randomUUID().toString().substring(0, 6);
        }

        Story story = new Story();
        story.setAuthor(author);
        story.setTitle(request.title());
        story.setSlug(slug);
        story.setDescription(request.description());
        story.setContentWarning(request.contentWarning());
        story.setAgeRating(request.ageRating());
        
        story.setStatus(StoryStatus.DRAFT);
        story.setVisibility(StoryVisibility.PUBLIC);

        setCategories(story, request.categoryIds());
        setTags(story, request.tags());

        story = storyRepository.save(story);
        sendNewStoryNotifications(story);

        return mapToResponse(story);
    }

    @Transactional
    public StoryResponse updateStory(Long id, UpdateStoryRequest request) {
        Story story = storyRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Story not found"));

        checkOwnership(story);

        story.setTitle(request.title());
        story.setDescription(request.description());
        if (request.status() != null) {
            StoryStatus newStatus = StoryStatus.valueOf(request.status().toUpperCase());
            if (newStatus == StoryStatus.HIDDEN || newStatus == StoryStatus.DRAFT) {
                // Set all published chapters to DRAFT
                List<com.abora.backend.chapter.Chapter> chapters = chapterRepository.findByStoryIdOrderByChapterNumberAsc(story.getId());
                for (com.abora.backend.chapter.Chapter c : chapters) {
                    if (c.getStatus() == ChapterStatus.PUBLISHED) {
                        c.setStatus(ChapterStatus.DRAFT);
                        chapterRepository.save(c);
                    }
                }
            }
            story.setStatus(newStatus);
        }
        if (request.visibility() != null) {
            story.setVisibility(StoryVisibility.valueOf(request.visibility().toUpperCase()));
        }
        if (request.contentWarning() != null) {
            story.setContentWarning(request.contentWarning());
        }
        if (request.ageRating() != null) {
            story.setAgeRating(request.ageRating());
        }

        setCategories(story, request.categoryIds());
        setTags(story, request.tags());

        story = storyRepository.save(story);

        return mapToResponse(story);
    }

    @Transactional
    public StoryResponse uploadCover(Long id, MultipartFile file) {
        Story story = storyRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Story not found"));

        checkOwnership(story);

        String url = storageService.store(file, "covers");
        story.setCoverImageUrl(url);
        story = storyRepository.save(story);
        return mapToResponse(story);
    }

    @Transactional(readOnly = true)
    public Page<StoryResponse> getPublicStories(Pageable pageable) {
        return storyRepository.findPublicStoriesWithPublishedChapters(pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public PublicStoryDetailResponse getPublicStoryDetail(String slug) {
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

        Long currentUserId = getCurrentUserIdOptional();
        boolean isAuthor = currentUserId != null && story.getAuthor().getId().equals(currentUserId);

        if (story.getVisibility() != StoryVisibility.PUBLIC && !isAuthor) {
            throw new NotFoundException("Story not found");
        }

        List<Chapter> chapters;
        if (isAuthor) {
            chapters = chapterRepository.findByStoryIdOrderByChapterNumberAsc(story.getId());
        } else {
            chapters = chapterRepository.findByStoryIdAndStatusOrderByChapterNumberAsc(
                    story.getId(), ChapterStatus.PUBLISHED);
        }

        List<TocChapterDto> toc = chapters.stream()
                .map(c -> new TocChapterDto(c.getId(), c.getChapterNumber(), c.getSlug(), c.getTitle(), c.getPublishedAt()))
                .toList();

        StoryResponse baseResponse = mapToResponse(story);

        return new PublicStoryDetailResponse(
                baseResponse.id(), baseResponse.authorId(), baseResponse.authorName(),
                story.getAuthor().getUsername(),
                story.getAuthor().getAvatarUrl(),
                baseResponse.title(), baseResponse.slug(), baseResponse.description(),
                baseResponse.coverImageUrl(), baseResponse.contentWarning(),
                baseResponse.ageRating(), baseResponse.language(),
                baseResponse.wordCount(), baseResponse.viewCount(),
                baseResponse.followCount(), baseResponse.favoriteCount(),
                baseResponse.commentCount(), baseResponse.chapterCount(),
                baseResponse.createdAt(), baseResponse.updatedAt(),
                baseResponse.categories(), baseResponse.tags(),
                toc
        );
    }

    @Transactional(readOnly = true)
    public List<StoryResponse> getAuthorStories() {
        Long currentUserId = getCurrentUserId();
        return storyRepository.findByAuthorIdOrderByUpdatedAtDesc(currentUserId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public StoryResponse getStoryByIdForManagement(Long id) {
        Story story = storyRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Story not found"));
        checkOwnership(story);
        return mapToResponse(story);
    }

    private void checkOwnership(Story story) {
        Long currentUserId = getCurrentUserId();
        if (!story.getAuthor().getId().equals(currentUserId)) {
            throw new ForbiddenException("You do not have permission to modify this story.");
        }
    }

    @Transactional
    public void deleteStory(Long id) {
        Story story = storyRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Story not found"));
        checkOwnership(story);
        storyRepository.delete(story);
    }

    private void setCategories(Story story, List<Long> categoryIds) {
        if (categoryIds == null || categoryIds.isEmpty()) {
            throw new BadRequestException("Truyện phải thuộc ít nhất một thể loại");
        }
        List<Category> categories = categoryRepository.findByIdIn(categoryIds);
        if (categories.isEmpty()) {
            throw new BadRequestException("Thể loại không hợp lệ");
        }
        story.setCategories(new HashSet<>(categories));
    }

    public List<StoryResponse> getStoriesByAuthorId(Long authorId) {
        return storyRepository.findByAuthorIdOrderByUpdatedAtDesc(authorId).stream().map(this::mapToResponse).toList();
    }

    private void setTags(Story story, List<String> tagNames) {
        if (tagNames != null && !tagNames.isEmpty()) {
            List<String> trimmedNames = tagNames.stream().map(String::trim).toList();
            List<Tag> existingTags = tagRepository.findByNameIn(trimmedNames);
            Set<Tag> tags = new HashSet<>(existingTags);

            Set<String> existingTagNames = existingTags.stream().map(Tag::getName).collect(Collectors.toSet());
            for (String name : trimmedNames) {
                if (!existingTagNames.contains(name)) {
                    Tag newTag = new Tag();
                    newTag.setName(name);
                    newTag.setSlug(SlugUtil.toSlug(name));
                    tags.add(tagRepository.save(newTag));
                }
            }
            story.setTags(tags);
        } else {
            story.setTags(new HashSet<>());
        }
    }

    private Long getCurrentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser user) {
            return user.getId();
        }
        throw new ForbiddenException("User not authenticated");
    }

    private Long getCurrentUserIdOptional() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser user) {
            return user.getId();
        }
        return null;
    }

    public StoryResponse mapToResponse(Story story) {
        var latestOpt = chapterRepository.findFirstByStoryIdAndStatusOrderByChapterNumberDesc(story.getId(), ChapterStatus.PUBLISHED);
        Integer latestNum = latestOpt.map(Chapter::getChapterNumber).orElse(null);
        String latestTitle = latestOpt.map(Chapter::getTitle).orElse(null);

        int publishedCount = (int) chapterRepository.countByStoryIdAndStatus(story.getId(), ChapterStatus.PUBLISHED);
        int draftCount = (int) chapterRepository.countByStoryIdAndStatus(story.getId(), ChapterStatus.DRAFT);

        return new StoryResponse(
                story.getId(),
                story.getAuthor().getId(),
                story.getAuthor().getDisplayName(),
                story.getTitle(),
                story.getSlug(),
                story.getDescription(),
                story.getCoverImageUrl(),
                story.getStatus().name(),
                story.getVisibility().name(),
                story.getContentWarning(),
                story.getAgeRating(),
                story.getLanguage(),
                story.getWordCount(),
                story.getViewCount(),
                story.getFollowCount(),
                story.getFavoriteCount(),
                story.getCommentCount(),
                story.getChapterCount(),
                story.getCreatedAt(),
                story.getUpdatedAt(),
                story.getCategories().stream()
                        .map(c -> new CategoryDto(c.getId(), c.getName(), c.getSlug(), ""))
                        .toList(),
                story.getTags().stream()
                        .map(t -> new TagDto(t.getId(), t.getName(), t.getSlug()))
                        .toList(),
                latestNum,
                latestTitle,
                publishedCount,
                draftCount
        );
    }

    @Transactional(readOnly = true)
    public List<StoryResponse> getReadingStories() {
        Long userId = getCurrentUserIdOptional();
        if (userId == null) {
            return List.of();
        }
        List<com.abora.backend.library.ReadingHistory> histories = readingHistoryRepository
                .findAllByUserIdAndStatusOrderByUpdatedAtDesc(userId, com.abora.backend.library.ReadingStatus.READING);
        return histories.stream()
                .limit(24)
                .map(rh -> mapToResponse(rh.getStory()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StoryResponse> getTrendingStories() {
        Instant sevenDaysAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        return storyRepository.findTrendingStories(sevenDaysAgo).stream()
                .limit(10)
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StoryResponse> getPersonalizedRecommendations() {
        Long userId = getCurrentUserIdOptional();
        if (userId == null) {
            return getTrendingStories().stream().limit(10).toList();
        }

        List<StoryResponse> result = new ArrayList<>();
        Set<Long> readStoryIds = new HashSet<>();
        
        Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);
        List<com.abora.backend.library.ReadingHistory> recentHistory = readingHistoryRepository.findRecentHistory(userId, thirtyDaysAgo);
        
        for (com.abora.backend.library.ReadingHistory rh : recentHistory) {
            readStoryIds.add(rh.getStory().getId());
        }

        Map<Long, Integer> categoryChapterCounts = new HashMap<>();
        for (com.abora.backend.library.ReadingHistory rh : recentHistory) {
            int chaptersRead = rh.getLastReadChapter() != null ? rh.getLastReadChapter().getChapterNumber() : 1;
            for (Category cat : rh.getStory().getCategories()) {
                categoryChapterCounts.put(cat.getId(), categoryChapterCounts.getOrDefault(cat.getId(), 0) + chaptersRead);
            }
        }

        List<Long> topCategoryIds = categoryChapterCounts.entrySet().stream()
                .sorted(Map.Entry.<Long, Integer>comparingByValue().reversed())
                .limit(2)
                .map(Map.Entry::getKey)
                .toList();

        if (!topCategoryIds.isEmpty()) {
            List<Story> recommended = storyRepository.findByCategoryIdIn(topCategoryIds);
            for (Story s : recommended) {
                if (result.size() >= 10) break;
                if (!readStoryIds.contains(s.getId())) {
                    result.add(mapToResponse(s));
                    readStoryIds.add(s.getId());
                }
            }
        }

        if (result.size() < 10) {
            List<SearchHistory> searchHistories = searchHistoryRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
            List<String> queries = searchHistories.stream()
                    .map(SearchHistory::getQuery)
                    .distinct()
                    .limit(5)
                    .toList();
            
            for (String q : queries) {
                if (result.size() >= 10) break;
                List<Story> matchedStories = storyRepository.searchStoriesByTitleOrCategory(q);
                for (Story s : matchedStories) {
                    if (result.size() >= 10) break;
                    if (!readStoryIds.contains(s.getId())) {
                        result.add(mapToResponse(s));
                        readStoryIds.add(s.getId());
                    }
                }
            }
        }

        if (result.size() < 10) {
            List<Story> fallbackStories = storyRepository.findTopVotedAndViewedStories();
            for (Story s : fallbackStories) {
                if (result.size() >= 10) break;
                if (!readStoryIds.contains(s.getId())) {
                    result.add(mapToResponse(s));
                    readStoryIds.add(s.getId());
                }
            }
        }

        return result;
    }

    @Transactional
    public List<StoryResponse> searchStories(String query) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }
        String cleanQuery = query.trim();
        Long userId = getCurrentUserIdOptional();
        if (userId != null) {
            try {
                SearchHistory sh = new SearchHistory();
                sh.setUser(userRepository.getReferenceById(userId));
                sh.setQuery(cleanQuery);
                searchHistoryRepository.save(sh);
            } catch (Exception e) {}
        }
        return storyRepository.searchStoriesByTitleOrCategory(cleanQuery).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StoryResponse> getViewedLeaderboard(String period) {
        List<Story> stories;
        if ("week".equalsIgnoreCase(period)) {
            Instant since = Instant.now().minus(7, ChronoUnit.DAYS);
            stories = storyRepository.findLeaderboardByViewsInPeriod(since);
        } else if ("month".equalsIgnoreCase(period)) {
            Instant since = Instant.now().minus(30, ChronoUnit.DAYS);
            stories = storyRepository.findLeaderboardByViewsInPeriod(since);
        } else {
            stories = storyRepository.findLeaderboardByViewsAllTime();
        }
        return stories.stream().limit(10).map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<StoryResponse> getVotedLeaderboard() {
        return storyRepository.findLeaderboardByVotes().stream()
                .limit(10)
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TagLeaderboardProjection> getTagsLeaderboard() {
        return tagRepository.findTopTagsLeaderboard().stream()
                .limit(10)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AuthorLeaderboardProjection> getAuthorsLeaderboard() {
        return userRepository.findTopAuthorsLeaderboard().stream()
                .limit(10)
                .toList();
    }

    private void sendNewStoryNotifications(Story story) {
        Long authorId = story.getAuthor().getId();
        List<Long> followerIds = userFollowRepository.findFollowerIdsByFollowingId(authorId);
        if (followerIds == null || followerIds.isEmpty()) {
            return;
        }
        String targetUrl = "/story/" + story.getSlug();
        String message = "New story \"" + story.getTitle() + "\" posted by " + story.getAuthor().getDisplayName();
        for (Long followerId : followerIds) {
            notificationService.createNotification(
                    followerId,
                    authorId,
                    NotificationType.NEW_STORY,
                    "Story",
                    story.getId(),
                    message,
                    targetUrl
            );
        }
    }
}
