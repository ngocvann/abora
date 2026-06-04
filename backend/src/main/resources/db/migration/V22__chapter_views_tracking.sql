CREATE TABLE chapter_views (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    chapter_id BIGINT NOT NULL,
    user_id BIGINT,
    ip_address VARCHAR(45),
    viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chapter_views_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    CONSTRAINT fk_chapter_views_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_chapter_views_chapter_user ON chapter_views(chapter_id, user_id, viewed_at);
CREATE INDEX idx_chapter_views_chapter_ip ON chapter_views(chapter_id, ip_address, viewed_at);
