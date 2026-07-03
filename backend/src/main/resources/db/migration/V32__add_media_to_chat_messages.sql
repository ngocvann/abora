-- Flyway Migration V32: Add media_url and media_type to chat_messages safely

ALTER TABLE chat_messages MODIFY content TEXT NULL;

SET @dbname = DATABASE();

SET @preparedStatement1 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'chat_messages' AND COLUMN_NAME = 'media_url') > 0,
  'SELECT 1',
  'ALTER TABLE chat_messages ADD COLUMN media_url VARCHAR(512) DEFAULT NULL'
));
PREPARE stmt1 FROM @preparedStatement1;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

SET @preparedStatement2 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'chat_messages' AND COLUMN_NAME = 'media_type') > 0,
  'SELECT 1',
  'ALTER TABLE chat_messages ADD COLUMN media_type VARCHAR(20) DEFAULT NULL'
));
PREPARE stmt2 FROM @preparedStatement2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
