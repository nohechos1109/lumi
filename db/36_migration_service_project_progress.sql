-- Avances (progress entries) for PLANEACION. Entries are immutable.
-- Attachments: 0..N files per entry, stored via existing `files` table
-- with entity_type='service_project_progress' and entity_id = progress entry id.
CREATE TABLE IF NOT EXISTS service_project_progress_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_project_id uuid NOT NULL REFERENCES service_projects(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES users(id),
  texto text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_progress_project
  ON service_project_progress_entries(service_project_id, created_at DESC);
