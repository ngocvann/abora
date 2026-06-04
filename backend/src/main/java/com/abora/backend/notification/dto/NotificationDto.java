package com.abora.backend.notification.dto;

import com.abora.backend.notification.NotificationType;

import java.time.Instant;

public record NotificationDto(
        Long id,
        NotificationType type,
        String message,
        String entityType,
        Long entityId,
        Long actorId,
        boolean read,
        Instant createdAt,
        String targetUrl
) {}
