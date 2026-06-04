-- V7__auth_upgrade.sql
-- ============================================================
-- 1. Cho phép password_hash = NULL (bắt buộc cho OAuth2 user)
-- ============================================================
ALTER TABLE users
    MODIFY COLUMN password_hash VARCHAR(255) NULL;

-- ============================================================
-- 2. Thêm PENDING_VERIFICATION vào tập giá trị status
--    (Không cần ALTER ENUM với VARCHAR – đã là VARCHAR(30))
-- ============================================================

-- ============================================================
-- 3. Thêm cột OAuth2 provider
-- ============================================================
ALTER TABLE users
    ADD COLUMN oauth_provider    VARCHAR(30)  NULL AFTER email_verified,
    ADD COLUMN oauth_provider_id VARCHAR(255) NULL AFTER oauth_provider;

-- Index: đảm bảo mỗi social account chỉ liên kết 1 tài khoản Abora
CREATE UNIQUE INDEX uq_users_oauth
    ON users (oauth_provider, oauth_provider_id);
