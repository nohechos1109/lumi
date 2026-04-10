-- Migration 10: Tabla sale_anticipos
-- Registra qué customer_payments son anticipos vinculados a una venta específica.

CREATE TABLE IF NOT EXISTS sale_anticipos (
  id          uuid          DEFAULT gen_random_uuid() NOT NULL,
  number      text          NOT NULL,
  sale_id     uuid          NOT NULL,
  payment_id  uuid          NOT NULL,
  concept     text,
  created_at  timestamptz   DEFAULT now() NOT NULL,
  CONSTRAINT sale_anticipos_pkey        PRIMARY KEY (id),
  CONSTRAINT sale_anticipos_number_key  UNIQUE (number),
  CONSTRAINT sale_anticipos_sale_fk     FOREIGN KEY (sale_id)    REFERENCES sales(id),
  CONSTRAINT sale_anticipos_payment_fk  FOREIGN KEY (payment_id) REFERENCES customer_payments(id)
);

CREATE INDEX IF NOT EXISTS idx_sale_anticipos_sale    ON sale_anticipos(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_anticipos_payment ON sale_anticipos(payment_id);
