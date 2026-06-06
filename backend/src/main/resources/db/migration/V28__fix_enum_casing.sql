-- V28__fix_enum_casing.sql
-- Convert lowercase visibility values to uppercase
UPDATE stories SET visibility = 'PUBLIC' WHERE visibility = 'public';
UPDATE stories SET visibility = 'PRIVATE' WHERE visibility = 'private';
UPDATE stories SET visibility = 'UNLISTED' WHERE visibility = 'unlisted';

-- Convert lowercase status values to uppercase
UPDATE stories SET status = 'DRAFT' WHERE status = 'draft';
UPDATE stories SET status = 'PUBLISHED' WHERE status = 'published';
UPDATE stories SET status = 'HIDDEN' WHERE status = 'hidden';
UPDATE stories SET status = 'COMPLETED' WHERE status = 'completed';
UPDATE stories SET status = 'PAUSED' WHERE status = 'paused';
UPDATE stories SET status = 'ONGOING' WHERE status = 'ongoing';

-- Convert lowercase status values in chapters
UPDATE chapters SET status = 'DRAFT' WHERE status = 'draft';
UPDATE chapters SET status = 'PUBLISHED' WHERE status = 'published';
