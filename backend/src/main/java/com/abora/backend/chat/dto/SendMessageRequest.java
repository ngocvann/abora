package com.abora.backend.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SendMessageRequest(
    @NotNull(message = "Người nhận không được để trống")
    Long recipientId,

    @NotBlank(message = "Nội dung tin nhắn không được để trống")
    String content
) {}
