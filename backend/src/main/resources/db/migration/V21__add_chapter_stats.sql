ALTER TABLE chapters
ADD COLUMN view_count BIGINT DEFAULT 0,
ADD COLUMN like_count INT DEFAULT 0,
ADD COLUMN comment_count INT DEFAULT 0;

CREATE TABLE chapter_likes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    chapter_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chapter_likes_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_chapter_likes_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id),
    CONSTRAINT uk_chapter_like_user_chapter UNIQUE (user_id, chapter_id)
);
