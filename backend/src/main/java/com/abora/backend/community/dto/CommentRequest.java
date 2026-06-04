package com.abora.backend.community.dto;

import jakarta.validation.constraints.NotBlank;

public record CommentRequest(
        @NotBlank
        String content,
        
        Long parentId
) {
}
