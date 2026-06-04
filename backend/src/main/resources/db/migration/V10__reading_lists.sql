-- V10__reading_lists.sql

-- Bảng danh sách đọc (reading_lists)
CREATE TABLE reading_lists (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_reading_lists_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_reading_lists_user_id ON reading_lists(user_id);

-- Bảng trung gian chi tiết truyện trong danh sách đọc (reading_list_stories)
CREATE TABLE reading_list_stories (
    list_id BIGINT NOT NULL,
    story_id BIGINT NOT NULL,
    PRIMARY KEY (list_id, story_id),
    CONSTRAINT fk_rl_stories_list FOREIGN KEY (list_id) REFERENCES reading_lists(id) ON DELETE CASCADE,
    CONSTRAINT fk_rl_stories_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);
