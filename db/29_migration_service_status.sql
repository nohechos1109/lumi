-- Add en_revision and terminado to services estatus CHECK constraint
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_estatus_check;
ALTER TABLE services ADD CONSTRAINT services_estatus_check
  CHECK (estatus IN ('pendiente','agendado','en_curso','en_revision','terminado','cancelado','rechazado'));
