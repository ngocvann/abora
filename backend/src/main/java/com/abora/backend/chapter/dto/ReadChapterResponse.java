package com.abora.backend.chapter.dto;

import java.time.Instant;

public record ReadChapterResponse(
        Long id,
        Long storyId,
        String title,
        Integer chapterNumber,
        String slug,
        String content,
        Integer wordCount,
        Integer estimatedReadingTime,
        Instant publishedAt,
        String prevChapterSlug,
        String nextChapterSlug,
        Long viewCount,
        Integer likeCount,
        Integer commentCount,
        Boolean hasLiked,
        Integer lastReadPosition
) {
}
