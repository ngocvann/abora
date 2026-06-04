package com.abora.backend.story.dto;

public record CategoryDto(
        Long id,
        String name,
        String slug,
        String description
) {
}
