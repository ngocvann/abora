package com.abora.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @Email
        @NotBlank
        @Size(max = 255)
        String email,

        @NotBlank
        @Size(min = 8, max = 72)
        String password,

        @Size(min = 3, max = 50)
        @Pattern(regexp = "^[a-zA-Z0-9_]+$")
        String username,

        @Size(min = 2, max = 100)
        String displayName
) {
}