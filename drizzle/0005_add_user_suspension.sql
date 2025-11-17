-- Add isSuspended field to user table
ALTER TABLE user ADD COLUMN is_suspended INTEGER DEFAULT 0 NOT NULL;
