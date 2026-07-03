package com.abora.backend.chat.dto;

import jakarta.validation.constraints.NotNull;

public record SendMessageRequest(
    @NotNull(message = "Người nhận không được để trống")
    Long recipientId,

    String content,

    String mediaUrl,

    String mediaType
) {}
