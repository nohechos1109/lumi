-- Migración: técnicos asignados a órdenes de servicio (se propagan a servicios)
CREATE TABLE IF NOT EXISTS service_order_technicians (
  service_order_id uuid NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at      timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT service_order_technicians_pkey PRIMARY KEY (service_order_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_service_order_technicians_user ON service_order_technicians (user_id);
