-- V19__add_stats_to_stories.sql
ALTER TABLE stories
ADD COLUMN favorite_count INT NOT NULL DEFAULT 0,
ADD COLUMN comment_count INT NOT NULL DEFAULT 0;
