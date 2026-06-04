ALTER TABLE user_follows
    ADD COLUMN muted_notifications BOOLEAN NOT NULL DEFAULT FALSE;
