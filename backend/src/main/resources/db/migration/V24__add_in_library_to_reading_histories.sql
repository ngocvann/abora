ALTER TABLE reading_histories ADD COLUMN in_library BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE reading_histories SET in_library = TRUE;
