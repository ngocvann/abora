package com.abora.backend.notification;

public enum NotificationType {
    /** Truyện đang theo dõi có chương mới */
    NEW_CHAPTER,
    /** Tác giả đang theo dõi đăng truyện mới */
    NEW_STORY,
    /** Có người reply comment của user */
    COMMENT_REPLY,
    /** Thông báo từ hệ thống (Admin gửi) */
    SYSTEM_ALERT,
    /** Có người theo dõi mới */
    NEW_FOLLOWER,
    /** Có người thích bình luận */
    LIKE_COMMENT,
    /** Có người thích bài viết */
    LIKE_POST,
    /** Nội dung bị xóa bởi Admin */
    CONTENT_DELETED,
    /** Tài khoản bị cảnh báo/khóa */
    ACCOUNT_BANNED,
    /** Có bình luận mới trong truyện của tác giả */
    NEW_COMMENT,
    /** Có người yêu thích (tim) truyện */
    LIKE_STORY,
    /** Có người thêm truyện vào danh sách đọc */
    ADD_TO_READING_LIST
}
