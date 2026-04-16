-- Migración: tipo_lugar (Calle/Taller) en órdenes y servicios
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS tipo_lugar text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS tipo_lugar text;

-- CHECK constraint
ALTER TABLE service_orders DROP CONSTRAINT IF EXISTS service_orders_tipo_lugar_check;
ALTER TABLE service_orders ADD CONSTRAINT service_orders_tipo_lugar_check
  CHECK (tipo_lugar IS NULL OR tipo_lugar IN ('calle', 'taller'));

ALTER TABLE services DROP CONSTRAINT IF EXISTS services_tipo_lugar_check;
ALTER TABLE services ADD CONSTRAINT services_tipo_lugar_check
  CHECK (tipo_lugar IS NULL OR tipo_lugar IN ('calle', 'taller'));
