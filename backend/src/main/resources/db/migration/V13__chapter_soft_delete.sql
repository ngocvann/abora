-- Migration to add soft delete flag to chapters table
ALTER TABLE chapters ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
