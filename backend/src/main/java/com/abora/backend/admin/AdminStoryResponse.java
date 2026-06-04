package com.abora.backend.admin;

import com.abora.backend.story.Story;
import com.abora.backend.story.StoryStatus;
import com.abora.backend.story.StoryVisibility;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class AdminStoryResponse {
    private Long id;
    private String title;
    private String slug;
    private String authorName;
    private Long authorId;
    private StoryStatus status;
    private StoryVisibility visibility;
    private Long viewCount;
    private Integer chapterCount;
    private Instant createdAt;
    private Instant updatedAt;

    public static AdminStoryResponse fromStory(Story story) {
        return AdminStoryResponse.builder()
                .id(story.getId())
                .title(story.getTitle())
                .slug(story.getSlug())
                .authorName(story.getAuthor() != null ? story.getAuthor().getDisplayName() : null)
                .authorId(story.getAuthor() != null ? story.getAuthor().getId() : null)
                .status(story.getStatus())
                .visibility(story.getVisibility())
                .viewCount(story.getViewCount())
                .chapterCount(story.getChapterCount())
                .createdAt(story.getCreatedAt())
                .updatedAt(story.getUpdatedAt())
                .build();
    }
}
