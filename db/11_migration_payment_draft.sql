-- Migration: Add 'draft' state to customer_payments
-- Payments now start as draft and must be confirmed before they can be applied.

ALTER TABLE customer_payments DROP CONSTRAINT IF EXISTS customer_payments_state_check;
ALTER TABLE customer_payments ADD CONSTRAINT customer_payments_state_check
  CHECK (state IN ('draft','confirmed','cancelled'));
ALTER TABLE customer_payments ALTER COLUMN state SET DEFAULT 'draft';
