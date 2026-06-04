package com.abora.backend.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        /**
         * Mật khẩu hiện tại – BẮT BUỘC nếu account đã có password.
         * Có thể null nếu là OAuth2 user chưa thiết lập password lần đầu.
         */
        String currentPassword,

        @NotBlank(message = "Mật khẩu mới không được để trống")
        @Size(min = 8, message = "Mật khẩu mới phải có ít nhất 8 ký tự")
        String newPassword,

        @NotBlank(message = "Xác nhận mật khẩu không được để trống")
        String confirmPassword
) {}
