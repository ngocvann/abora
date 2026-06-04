-- Fix reports table schema issue caused by V12
-- Drop old user_id column that was replaced by reporter_id

ALTER TABLE reports DROP FOREIGN KEY fk_reports_user;
ALTER TABLE reports DROP COLUMN user_id;
ALTER TABLE reports MODIFY COLUMN reporter_id BIGINT NOT NULL;
ALTER TABLE reports ADD CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE;
