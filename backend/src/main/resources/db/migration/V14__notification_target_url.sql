-- Thêm cột target_url vào bảng notifications để hỗ trợ deep linking
ALTER TABLE notifications ADD COLUMN target_url VARCHAR(500) NULL;
