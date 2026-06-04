package com.abora.backend.community.dto;
import java.time.Instant;
import java.util.List;
public record CommentResponse(
        Long id,
        Long chapterId,
        Long userId,
        String userName,
        String displayName,
        String avatarUrl,
        String content,
        Long parentId,
        List<CommentResponse> replies,
        Instant createdAt
) {}