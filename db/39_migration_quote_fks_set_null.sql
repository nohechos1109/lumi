-- Migración 39: permite borrar cotizaciones sin cascadear ventas
-- sales.quote_id y quotes.renewed_from_id → ON DELETE SET NULL
-- Razón: al borrar una cotización, preservar el historial financiero (ventas)
-- y las renovaciones existentes rompiendo solo el link a la cotización origen.

ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_quote_id_fkey;
ALTER TABLE sales ADD CONSTRAINT sales_quote_id_fkey
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL;

ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_renewed_from_id_fkey;
ALTER TABLE quotes ADD CONSTRAINT quotes_renewed_from_id_fkey
  FOREIGN KEY (renewed_from_id) REFERENCES quotes(id) ON DELETE SET NULL;
