package com.abora.backend.chapter.dto;

import java.time.Instant;

public record ChapterSummaryResponse(
        Long id,
        Long storyId,
        String title,
        Integer chapterNumber,
        String slug,
        String status,
        Integer wordCount,
        Integer estimatedReadingTime,
        Instant publishedAt,
        Instant createdAt,
        Instant updatedAt,
        Long viewCount,
        Integer likeCount,
        Integer commentCount
) {
}
