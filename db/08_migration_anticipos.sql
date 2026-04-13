-- Migration 08: tabla sale_anticipos
-- Un anticipo es un pago confirmado a nivel venta, registrado
-- ANTES de que existan notas. La aplicación a notas se hace después
-- creando payment_applications normales sobre el mismo payment_id.

CREATE TABLE IF NOT EXISTS sale_anticipos (
  id          uuid        DEFAULT gen_random_uuid() NOT NULL,
  number      text        NOT NULL,
  sale_id     uuid        NOT NULL,
  payment_id  uuid        NOT NULL,   -- pago confirmado subyacente
  concept     text,
  created_at  timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT sale_anticipos_pkey   PRIMARY KEY (id),
  CONSTRAINT sale_anticipos_numkey UNIQUE (number),
  CONSTRAINT sale_anticipos_sale   FOREIGN KEY (sale_id)    REFERENCES sales(id)    ON DELETE CASCADE,
  CONSTRAINT sale_anticipos_pay    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sale_anticipos_sale ON sale_anticipos(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_anticipos_pay  ON sale_anticipos(payment_id);
