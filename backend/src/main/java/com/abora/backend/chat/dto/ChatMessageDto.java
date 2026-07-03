package com.abora.backend.chat.dto;

import java.time.Instant;

public record ChatMessageDto(
    Long id,
    Long senderId,
    String senderUsername,
    String senderDisplayName,
    String senderAvatarUrl,
    Long recipientId,
    String content,
    String mediaUrl,
    String mediaType,
    boolean isRead,
    Instant createdAt
) {}
