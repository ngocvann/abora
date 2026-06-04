package com.abora.backend.user;

public enum UserStatus {
    /** Đã đăng ký nhưng chưa xác thực email */
    PENDING_VERIFICATION,
    /** Tài khoản hoạt động bình thường */
    ACTIVE,
    /** Bị đình chỉ tạm thời */
    SUSPENDED,
    /** Bị cấm vĩnh viễn */
    BANNED
}
