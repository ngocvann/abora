package com.abora.backend.readinglist.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateReadingListRequest(
        @NotBlank(message = "Tên danh sách đọc không được để trống")
        String name,
        
        boolean isPublic
) {
}
