-- Partial index for fast overdue detection across all pending schedule items
CREATE INDEX IF NOT EXISTS idx_psi_overdue
  ON payment_schedule_items (due_date, state)
  WHERE state = 'pending';
