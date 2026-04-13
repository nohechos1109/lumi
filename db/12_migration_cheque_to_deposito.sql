-- Reemplazar método de pago 'cheque' por 'deposito'

-- 1. Actualizar registros existentes
UPDATE payments SET payment_method = 'deposito' WHERE payment_method = 'cheque';
UPDATE customer_payments SET payment_method = 'deposito' WHERE payment_method = 'cheque';

-- 2. Reemplazar constraint en payments
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_method_check;
ALTER TABLE payments ADD CONSTRAINT payments_method_check
  CHECK (payment_method IN ('efectivo','transferencia','deposito','tarjeta','otro'));

-- 3. Reemplazar constraint en customer_payments
ALTER TABLE customer_payments DROP CONSTRAINT IF EXISTS customer_payments_method_check;
ALTER TABLE customer_payments ADD CONSTRAINT customer_payments_method_check
  CHECK (payment_method IN ('efectivo','transferencia','deposito','tarjeta','otro'));
