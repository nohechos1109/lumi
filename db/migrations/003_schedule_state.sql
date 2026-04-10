-- 003_schedule_state.sql — Add state column to payment_schedule_items

ALTER TABLE payment_schedule_items
  ADD COLUMN IF NOT EXISTS state text NOT NULL DEFAULT 'pending'
    CONSTRAINT psi_state_check CHECK (state IN ('pending', 'paid'));
