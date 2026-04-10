-- Migration 001: Add archived_at column to projects and quotes
-- Run: psql -U postgres -d cotizador -f db/migrations/001_add_archived_at.sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;
