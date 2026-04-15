-- Add 'finished' state to sales for manual completion distinct from auto-paid
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_state_check;
ALTER TABLE sales ADD CONSTRAINT sales_state_check
  CHECK (state IN ('active','paid','cancelled','finished'));
