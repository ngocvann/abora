package com.abora.backend.library.dto;

import com.abora.backend.library.ReadingStatus;
import jakarta.validation.constraints.NotNull;

public record AddToLibraryRequest(
        @NotNull
        Long storyId,
        
        ReadingStatus status
) {
}
