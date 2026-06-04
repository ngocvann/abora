-- =============================================================
-- V15__seed_mock_data.sql
-- Dữ liệu giả lập thực tế cho việc test toàn hệ thống Abora
-- Password mặc định tất cả users: password123
-- BCrypt hash: $2b$10$MJLZZgwTDpyaowJkKeVDGOzpZ8Q.hlqEmJlcY.6E3Oa5K67qSVOau
-- =============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================
-- 1. USERS (18 tài khoản)
-- =============================================================
INSERT IGNORE INTO users (id, email, password_hash, username, display_name, bio, avatar_url, role, status, email_verified, created_at, updated_at) VALUES
-- Tài khoản admin chính
(1,  'admin@abora.vn',       '$2b$10$MJLZZgwTDpyaowJkKeVDGOzpZ8Q.hlqEmJlcY.6E3Oa5K67qSVOau', 'admin',         'Admin Abora',         'Quản trị viên hệ thống Abora.', NULL, 'ADMIN',  'ACTIVE', TRUE, NOW() - INTERVAL 180 DAY, NOW()),
-- Tác giả (viết nhiều truyện)
(2,  'nguyen.van.an@gmail.com','$2b$10$MJLZZgwTDpyaowJkKeVDGOzpZ8Q.hlqEmJlcY.6E3Oa5K67qSVOau','nguyenvanan',   'Nguyễn Văn An',       'Tác giả truyện lãng mạn & viễn tưởng. Yêu thích cà phê và sách cũ.', NULL, 'USER', 'ACTIVE', TRUE, NOW() - INTERVAL 160 DAY, NOW()),
(3,  'le.thu.huong@gmail.com', '$2b$10$MJLZZgwTDpyaowJkKeVDGOzpZ8Q.hlqEmJlcY.6E3Oa5K67qSVOau','lethuhuong',    'Lê Thu Hương',        'Mê kinh dị và bí ẩn. Viết truyện vào nửa đêm.', NULL, 'USER', 'ACTIVE', TRUE, NOW() - INTERVAL 150 DAY, NOW());