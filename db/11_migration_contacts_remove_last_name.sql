-- Remove last_name column from contacts; name field holds the full name already
ALTER TABLE contacts DROP COLUMN IF EXISTS last_name;
