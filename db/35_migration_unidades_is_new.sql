-- Mark unidades that came from a quote and are not yet verified
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS is_new boolean NOT NULL DEFAULT false;
