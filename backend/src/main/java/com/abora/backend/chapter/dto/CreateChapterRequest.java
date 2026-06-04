package com.abora.backend.chapter.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateChapterRequest(
        @NotBlank
        @Size(max = 255)
        String title,

        @NotBlank
        String content,

        @NotNull
        Integer chapterNumber,

        @NotBlank
        String status
) {
}
