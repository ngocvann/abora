package com.abora.backend.post.dto;

import java.time.Instant;

public record CommentResponse(
    Long id,
    Long postId,
    Long userId,
    String userUsername,
    String userDisplayName,
    String userAvatarUrl,
    String content,
    Long parentId,
    java.util.List<CommentResponse> replies,
    Instant createdAt
) {}
