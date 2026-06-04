package com.abora.backend.community.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ReportRequest(
        @NotBlank
        String targetType,
        
        @NotNull
        Long targetId,
        
        @NotBlank
        String reason
) {
}
