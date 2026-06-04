package com.abora.backend.story.dto;

import java.time.Instant;
import java.util.List;

public record PublicStoryDetailResponse(
        Long id,
        Long authorId,
        String authorName,
        String authorUsername,
        String authorAvatarUrl,
        String title,
        String slug,
        String description,
        String coverImageUrl,
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
        List<TocChapterDto> chapters
) {
}
