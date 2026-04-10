-- Migration 09: Sistema de pagos global por cliente
-- Reemplaza payments (ligado a sales) por customer_payments (ligado a customers).
-- Los IDs se preservan → payment_applications.payment_id sigue válido.

-- ── 1. Nueva tabla ────────────────────────────────────────────────────────────
CREATE TABLE customer_payments (
  id             uuid          DEFAULT gen_random_uuid() NOT NULL,
  number         text          NOT NULL,
  customer_id    uuid          NOT NULL,
  state          text          NOT NULL DEFAULT 'confirmed',
  concept        text,
  amount         numeric(14,2) NOT NULL,
  payment_method text          NOT NULL,
  payment_date   date          NOT NULL DEFAULT CURRENT_DATE,
  reference      text,
  registered_by  uuid          NOT NULL,
  created_at     timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT customer_payments_pkey         PRIMARY KEY (id),
  CONSTRAINT customer_payments_num_key      UNIQUE (number),
  CONSTRAINT customer_payments_state_check  CHECK (state IN ('confirmed','cancelled')),
  CONSTRAINT customer_payments_amount_check CHECK (amount > 0),
  CONSTRAINT customer_payments_method_check CHECK (payment_method IN ('efectivo','transferencia','cheque','tarjeta','otro')),
  CONSTRAINT customer_payments_customer_fk  FOREIGN KEY (customer_id)  REFERENCES customers(id),
  CONSTRAINT customer_payments_user_fk      FOREIGN KEY (registered_by) REFERENCES users(id)
);

CREATE INDEX idx_cp_customer ON customer_payments(customer_id);
CREATE INDEX idx_cp_state    ON customer_payments(state, customer_id);

-- ── 2. Migrar pagos existentes (solo confirmed/cancelled tienen applications) ─
INSERT INTO customer_payments
  (id, number, customer_id, state, concept, amount, payment_method,
   payment_date, reference, registered_by, created_at)
SELECT
  p.id, p.number, s.customer_id, p.state, p.concept, p.amount,
  p.payment_method, p.payment_date, p.reference, p.registered_by, p.created_at
FROM payments p
JOIN sales s ON s.id = p.sale_id
WHERE p.state IN ('confirmed', 'cancelled');

-- ── 3. Re-apuntar FK de payment_applications ──────────────────────────────────
ALTER TABLE payment_applications DROP CONSTRAINT pa_payment_fkey;
ALTER TABLE payment_applications
  ADD CONSTRAINT pa_payment_fkey
  FOREIGN KEY (payment_id) REFERENCES customer_payments(id) ON DELETE CASCADE;

-- ── 4. Eliminar tablas viejas ─────────────────────────────────────────────────
DROP TABLE IF EXISTS sale_anticipos;
DROP TABLE payments;
