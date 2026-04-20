-- Add borrador and terminado to service_orders estatus CHECK constraint
ALTER TABLE service_orders DROP CONSTRAINT IF EXISTS service_orders_estatus_check;
ALTER TABLE service_orders ADD CONSTRAINT service_orders_estatus_check
  CHECK (estatus IN ('borrador','pendiente','agendado','en_curso','terminado','atendido','cancelado'));
ALTER TABLE service_orders ALTER COLUMN estatus SET DEFAULT 'borrador';
