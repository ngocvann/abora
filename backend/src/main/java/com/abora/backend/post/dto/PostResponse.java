package com.abora.backend.post.dto;

import com.abora.backend.post.PostType;
import java.time.Instant;

public record PostResponse(
    Long id,
    Long userId,
    String userUsername,
    String userDisplayName,
    String userAvatarUrl,
    String content,
    PostType type,
    Instant createdAt,
    long likeCount,
    long commentCount,
    boolean isLikedByMe
) {}
