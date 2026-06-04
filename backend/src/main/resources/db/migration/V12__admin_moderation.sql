-- Migration V12: Admin Moderation (upgrade reports table with extra columns)
-- Bảng reports đã tồn tại từ V4, chỉ cần thêm các cột cần thiết cho admin

ALTER TABLE reports
    ADD COLUMN reporter_id  BIGINT NULL AFTER user_id,
    ADD COLUMN moderator_note TEXT NULL,
    ADD COLUMN resolved_at  TIMESTAMP NULL,
    ADD COLUMN resolved_by  BIGINT NULL;

-- Đồng bộ reporter_id với user_id hiện có
UPDATE reports SET reporter_id = user_id WHERE reporter_id IS NULL;
