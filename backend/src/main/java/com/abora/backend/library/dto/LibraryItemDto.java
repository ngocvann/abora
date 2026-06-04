package com.abora.backend.library.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LibraryItemDto {
    private Long storyId;
    private String title;
    private String slug;
    private String coverImageUrl;
    private String authorName;
    private String authorAvatarUrl;
    private String description;
    private Long viewCount;
    private Integer chapterCount;
    private Integer starCount; // Placeholder if not in Story
    
    private String readingStatus;
    private boolean isFavorite;
    
    private Long lastReadChapterId;
    private Integer lastReadChapterNumber;
    private String lastReadChapterSlug;
    private String lastReadChapterTitle;
    private Integer lastReadPosition;
    private Instant lastReadAt;
}
