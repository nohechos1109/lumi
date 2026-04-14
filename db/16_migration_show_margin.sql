ALTER TABLE global_settings
  ADD COLUMN IF NOT EXISTS show_margin boolean NOT NULL DEFAULT true;
