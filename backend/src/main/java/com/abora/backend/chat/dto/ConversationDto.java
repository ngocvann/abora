package com.abora.backend.chat.dto;

import java.time.Instant;

public record ConversationDto(
    Long userId,
    String username,
    String displayName,
    String avatarUrl,
    String lastMessage,
    Instant lastMessageAt,
    long unreadCount
) {}
