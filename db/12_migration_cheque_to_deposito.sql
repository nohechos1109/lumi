-- Reemplazar método de pago 'cheque' por 'deposito'
-- Nota: la tabla payments fue eliminada en 09_migration_customer_payments.sql;
-- solo opera sobre customer_payments.

-- 1. Actualizar registros existentes
UPDATE customer_payments SET payment_method = 'deposito' WHERE payment_method = 'cheque';

-- 2. Reemplazar constraint en customer_payments
ALTER TABLE customer_payments DROP CONSTRAINT IF EXISTS customer_payments_method_check;
ALTER TABLE customer_payments ADD CONSTRAINT customer_payments_method_check
  CHECK (payment_method IN ('efectivo','transferencia','deposito','tarjeta','otro'));
