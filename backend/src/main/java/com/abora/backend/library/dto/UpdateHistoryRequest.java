package com.abora.backend.library.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateHistoryRequest(
        @NotNull
        Long storyId,

        @NotNull
        Long chapterId,

        Integer lastReadPosition
) {
}
