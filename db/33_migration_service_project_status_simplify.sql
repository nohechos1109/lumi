-- Simplify service_projects status: open|in_progress|completed|cancelled -> abierto|cerrado
ALTER TABLE service_projects DROP CONSTRAINT IF EXISTS service_projects_status_check;

UPDATE service_projects SET status='cerrado', archived_at=COALESCE(archived_at, now()) WHERE status='cancelled';
UPDATE service_projects SET status='cerrado' WHERE status='completed';
UPDATE service_projects SET status='abierto' WHERE status IN ('open','in_progress');

ALTER TABLE service_projects ALTER COLUMN status SET DEFAULT 'abierto';
ALTER TABLE service_projects ADD CONSTRAINT service_projects_status_check CHECK (status IN ('abierto','cerrado'));
