package com.abora.backend.readinglist.dto;

import com.abora.backend.story.dto.StoryResponse;
import java.time.Instant;
import java.util.List;

public record ReadingListResponse(
        Long id,
        Long userId,
        String userName,
        String name,
        boolean isPublic,
        List<StoryResponse> stories,
        Instant createdAt,
        Instant updatedAt
) {
}
