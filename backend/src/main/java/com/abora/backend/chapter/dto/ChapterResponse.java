package com.abora.backend.chapter.dto;

import java.time.Instant;

public record ChapterResponse(
        Long id,
        Long storyId,
        String title,
        Integer chapterNumber,
        String slug,
        String content,
        String status,
        Integer wordCount,
        Integer estimatedReadingTime,
        Instant publishedAt,
        Instant createdAt,
        Instant updatedAt
) {
}
