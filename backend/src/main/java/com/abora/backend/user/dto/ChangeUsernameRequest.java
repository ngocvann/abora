package com.abora.backend.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChangeUsernameRequest(
        @NotBlank(message = "Username không được để trống")
        @Size(min = 3, max = 50, message = "Username phải từ 3-50 ký tự")
        @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username chỉ chứa chữ cái, số và dấu gạch dưới")
        String newUsername
) {}
