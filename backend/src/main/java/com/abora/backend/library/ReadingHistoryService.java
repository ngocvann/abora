package com.abora.backend.library;

import com.abora.backend.auth.AuthenticatedUser;
import com.abora.backend.chapter.Chapter;
import com.abora.backend.chapter.ChapterRepository;
import com.abora.backend.common.exception.ForbiddenException;
import com.abora.backend.common.exception.NotFoundException;
import com.abora.backend.library.dto.UpdateHistoryRequest;
import com.abora.backend.story.Story;
import com.abora.backend.story.StoryRepository;
import com.abora.backend.user.User;
import com.abora.backend.user.UserRepository;
import com.abora.backend.library.dto.LibraryItemDto;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReadingHistoryService {

    private final ReadingHistoryRepository readingHistoryRepository;
    private final StoryRepository storyRepository;
    private final ChapterRepository chapterRepository;
    private final UserRepository userRepository;

    @Transactional
    public void updateReadingHistory(UpdateHistoryRequest request) {
        Long userId = getCurrentUserId();
        User user = userRepository.getReferenceById(userId);

        Story story = storyRepository.findById(request.storyId())
                .orElseThrow(() -> new NotFoundException("Story not found"));
        Chapter chapter = chapterRepository.findById(request.chapterId())
                .orElseThrow(() -> new NotFoundException("Chapter not found"));

        ReadingHistory history = readingHistoryRepository.findByUserIdAndStoryId(userId, request.storyId())
                .orElseGet(() -> {
                    ReadingHistory newHistory = new ReadingHistory();
                    newHistory.setUser(user);
                    newHistory.setStory(story);
                    return newHistory;
                });

        history.setStatus(ReadingStatus.READING);
        history.setLastReadChapter(chapter);
        if (request.lastReadPosition() != null) {
            history.setLastReadPosition(request.lastReadPosition());
        }
        history.setLastReadAt(Instant.now());
        readingHistoryRepository.save(history);
    }

    @Transactional
    public void addToLibrary(com.abora.backend.library.dto.AddToLibraryRequest request) {
        Long userId = getCurrentUserId();
        User user = userRepository.getReferenceById(userId);
        Story story = storyRepository.findById(request.storyId())
                .orElseThrow(() -> new NotFoundException("Story not found"));

        ReadingHistory history = readingHistoryRepository.findByUserIdAndStoryId(userId, request.storyId())
                .orElseGet(() -> {
                    ReadingHistory newHistory = new ReadingHistory();
                    newHistory.setUser(user);
                    newHistory.setStory(story);
                    newHistory.setStatus(request.status() != null ? request.status() : ReadingStatus.READ_LATER);
                    return newHistory;
                });
        
        history.setInLibrary(true);
        readingHistoryRepository.save(history);
    }

    @Transactional(readOnly = true)
    public List<LibraryItemDto> getLibraryItems(String type) {
        Long userId = getCurrentUserId();
        List<ReadingHistory> histories = readingHistoryRepository.findAllByUserIdOrderByUpdatedAtDesc(userId);
        
        // Filter to only return items that are explicitly in the library
        histories = histories.stream().filter(ReadingHistory::isInLibrary).collect(Collectors.toList());
        
        if ("FAVORITE".equals(type)) {
            histories = histories.stream().filter(ReadingHistory::isFavorite).collect(Collectors.toList());
        } else if (type != null && !type.equals("ALL")) {
            try {
                ReadingStatus status = ReadingStatus.valueOf(type);
                histories = histories.stream().filter(h -> h.getStatus() == status).collect(Collectors.toList());
            } catch (IllegalArgumentException e) {
                // Ignore invalid type
            }
        }
        return histories.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public void removeFromLibrary(Long storyId) {
        Long userId = getCurrentUserId();
        ReadingHistory history = readingHistoryRepository.findByUserIdAndStoryId(userId, storyId)
                .orElseThrow(() -> new NotFoundException("Library item not found"));
        if (history.getLastReadChapter() != null) {
            history.setInLibrary(false);
            readingHistoryRepository.save(history);
        } else {
            readingHistoryRepository.delete(history);
        }
    }

    private LibraryItemDto mapToDto(ReadingHistory history) {
        Story story = history.getStory();
        Chapter lastChapter = history.getLastReadChapter();

        return LibraryItemDto.builder()
                .storyId(story.getId())
                .title(story.getTitle())
                .slug(story.getSlug())
                .coverImageUrl(story.getCoverImageUrl())
                .authorName(story.getAuthor() != null ? story.getAuthor().getDisplayName() : "Unknown")
                .authorAvatarUrl(story.getAuthor() != null ? story.getAuthor().getAvatarUrl() : null)
                .description(story.getDescription())
                .viewCount(story.getViewCount())
                .chapterCount(story.getChapterCount())
                .starCount(story.getFollowCount()) // Placeholder
                .readingStatus(history.getStatus() != null ? history.getStatus().name() : null)
                .isFavorite(history.isFavorite())
                .lastReadChapterId(lastChapter != null ? lastChapter.getId() : null)
                .lastReadChapterNumber(lastChapter != null ? lastChapter.getChapterNumber() : null)
                .lastReadChapterSlug(lastChapter != null ? lastChapter.getSlug() : null)
                .lastReadChapterTitle(lastChapter != null ? lastChapter.getTitle() : null)
                .lastReadPosition(history.getLastReadPosition())
                .lastReadAt(history.getLastReadAt())
                .build();
    }

    private Long getCurrentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser authUser) {
            return authUser.getId();
        }
        throw new ForbiddenException("User not authenticated");
    }
}
