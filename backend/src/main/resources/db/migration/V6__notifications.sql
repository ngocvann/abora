-- V6__notifications.sql
-- Bảng lưu thông báo in-app cho người dùng
CREATE TABLE notifications (
    id          BIGINT NOT NULL AUTO_INCREMENT,
    user_id     BIGINT NOT NULL,            -- Người nhận thông báo
    actor_id    BIGINT NULL,               -- Người thực hiện hành động (có thể null nếu system event)
    type        VARCHAR(50) NOT NULL,      -- NEW_CHAPTER | NEW_STORY | COMMENT_REPLY
    entity_type VARCHAR(30) NULL,          -- STORY | CHAPTER | COMMENT
    entity_id   BIGINT NULL,              -- ID của đối tượng liên quan (để build link)
    message     TEXT NOT NULL,            -- Nội dung thông báo đã render sẵn
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index tối ưu query "lấy thông báo chưa đọc của user, sắp xếp mới nhất"
CREATE INDEX idx_notif_user_read ON notifications(user_id, is_read, created_at);
