-- V3__core_domain_schema.sql

-- Categories (Thể loại)
CREATE TABLE categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL
);

-- Tags (Thẻ)
CREATE TABLE tags (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE
);

-- Stories (Truyện)
CREATE TABLE stories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    author_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NULL,
    cover_image_url VARCHAR(500) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft', -- draft, published, hidden, completed, paused
    visibility VARCHAR(30) NOT NULL DEFAULT 'public', -- public, unlisted, private
    content_warning JSON NULL,
    age_rating VARCHAR(30) NULL,
    language VARCHAR(30) NOT NULL DEFAULT 'vi',
    word_count INT NOT NULL DEFAULT 0,
    view_count BIGINT NOT NULL DEFAULT 0,
    follow_count INT NOT NULL DEFAULT 0,
    chapter_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_stories_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_stories_status_visibility ON stories(status, visibility);
CREATE INDEX idx_stories_author_id ON stories(author_id);
CREATE INDEX idx_stories_created_at ON stories(created_at);

-- Story_Category (N-N)
CREATE TABLE story_categories (
    story_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    PRIMARY KEY (story_id, category_id),
    CONSTRAINT fk_story_categories_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    CONSTRAINT fk_story_categories_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Story_Tag (N-N)
CREATE TABLE story_tags (
    story_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    PRIMARY KEY (story_id, tag_id),
    CONSTRAINT fk_story_tags_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    CONSTRAINT fk_story_tags_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Chapters (Chương)
CREATE TABLE chapters (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    story_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    chapter_number INT NOT NULL,
    content LONGTEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft', -- draft, published
    word_count INT NOT NULL DEFAULT 0,
    estimated_reading_time INT NOT NULL DEFAULT 0, -- in minutes
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_chapters_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    UNIQUE KEY uk_story_chapter_number (story_id, chapter_number)
);

CREATE INDEX idx_chapters_story_status ON chapters(story_id, status);

-- Comments (Bình luận)
CREATE TABLE comments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    story_id BIGINT NOT NULL,
    chapter_id BIGINT NULL,
    parent_id BIGINT NULL,
    content TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'active', -- active, hidden, deleted
    like_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX idx_comments_story_id ON comments(story_id);
CREATE INDEX idx_comments_chapter_id ON comments(chapter_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);

-- Reading Histories / Library (Thư viện / Lịch sử đọc)
CREATE TABLE reading_histories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    story_id BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'reading', -- reading, read_later, completed
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    last_read_chapter_id BIGINT NULL,
    last_read_position INT NULL,
    last_read_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_reading_histories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_reading_histories_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    CONSTRAINT fk_reading_histories_chapter FOREIGN KEY (last_read_chapter_id) REFERENCES chapters(id) ON DELETE SET NULL,
    UNIQUE KEY uk_user_story (user_id, story_id)
);

CREATE INDEX idx_reading_histories_user_status ON reading_histories(user_id, status);
CREATE INDEX idx_reading_histories_user_favorite ON reading_histories(user_id, is_favorite);
