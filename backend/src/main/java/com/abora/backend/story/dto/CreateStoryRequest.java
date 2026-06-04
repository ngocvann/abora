package com.abora.backend.story.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateStoryRequest(
        @NotBlank
        @Size(max = 255)
        String title,

        String description,

        List<Long> categoryIds,
        List<String> tags,

        String contentWarning,
        String ageRating
) {
}
