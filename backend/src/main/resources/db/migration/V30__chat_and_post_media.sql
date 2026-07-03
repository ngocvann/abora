-- V30__chat_and_post_media.sql

-- Bảng chat_messages (Tin nhắn giữa người dùng)
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    sender_id BIGINT NOT NULL,
    recipient_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chat_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_chat_sender_recipient ON chat_messages(sender_id, recipient_id, created_at ASC);
CREATE INDEX idx_chat_recipient_unread ON chat_messages(recipient_id, is_read);

-- Thêm media_url và media_type vào bảng posts
ALTER TABLE posts ADD COLUMN media_url VARCHAR(512) DEFAULT NULL;
ALTER TABLE posts ADD COLUMN media_type VARCHAR(20) DEFAULT NULL;
