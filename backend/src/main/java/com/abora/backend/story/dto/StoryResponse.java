package com.abora.backend.story.dto;

import java.time.Instant;
import java.util.List;

public record StoryResponse(
        Long id,
        Long authorId,
        String authorName,
        String title,
        String slug,
        String description,
        String coverImageUrl,
        String status,
        String visibility,
        String contentWarning,
        String ageRating,
        String language,
        Integer wordCount,
        Long viewCount,
        Integer followCount,
        Integer favoriteCount,
        Integer commentCount,
        Integer chapterCount,
        Instant createdAt,
        Instant updatedAt,
        List<CategoryDto> categories,
        List<TagDto> tags,
        Integer latestChapterNumber,
        String latestChapterTitle,
        Integer publishedChapterCount,
        Integer draftChapterCount
) {
}
