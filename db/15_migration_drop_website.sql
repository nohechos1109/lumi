-- Migration 15: Remove website column from contacts table.
ALTER TABLE contacts DROP COLUMN IF EXISTS website;
