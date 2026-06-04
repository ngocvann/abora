package com.abora.backend.story.dto;

import java.time.Instant;

public record TocChapterDto(
        Long chapterId,
        Integer chapterNumber,
        String slug,
        String title,
        Instant publishedAt
) {
}
