package com.abora.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record OAuth2LoginRequest(
        /** id_token trả về từ Google Identity Services (Frontend gửi lên) */
        @NotBlank(message = "id_token không được để trống")
        String idToken
) {}
