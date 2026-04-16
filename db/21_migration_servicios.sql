-- Migración: Módulo de Servicios (Fase 1 MVP)
-- Agrega: products.is_service, rol 'tecnico', service_projects, service_orders,
-- services, service_technicians, service_requests.

-- 1. products.is_service — flag que dispara auto-creación desde cotización
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_service boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_is_service
  ON products (is_service) WHERE is_service = true;

-- 2. users.role — agregar 'tecnico' al CHECK
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role = ANY (ARRAY['sales','manager','admin','almacen','soporte','tecnico']));

-- 3. service_projects (parent del BPMN; NO confundir con la tabla `projects`)
CREATE TABLE IF NOT EXISTS service_projects (
  id            uuid DEFAULT gen_random_uuid() NOT NULL,
  number        text NOT NULL,
  name          text NOT NULL,
  customer_id   uuid REFERENCES contacts(id) ON DELETE SET NULL,
  sale_id       uuid REFERENCES sales(id)    ON DELETE SET NULL,
  created_by    uuid REFERENCES users(id),
  status        text NOT NULL DEFAULT 'open',
  observaciones text,
  created_at    timestamptz DEFAULT now() NOT NULL,
  archived_at   timestamptz NULL,
  CONSTRAINT service_projects_pkey PRIMARY KEY (id),
  CONSTRAINT service_projects_status_check
    CHECK (status IN ('open','in_progress','completed','cancelled'))
);
CREATE UNIQUE INDEX IF NOT EXISTS service_projects_number_key ON service_projects (number);
CREATE INDEX IF NOT EXISTS idx_service_projects_customer   ON service_projects (customer_id);
CREATE INDEX IF NOT EXISTS idx_service_projects_sale       ON service_projects (sale_id);
CREATE INDEX IF NOT EXISTS idx_service_projects_created_by ON service_projects (created_by);

-- 4. service_orders (Orden de servicio)
CREATE TABLE IF NOT EXISTS service_orders (
  id                     uuid DEFAULT gen_random_uuid() NOT NULL,
  number                 text NOT NULL,
  service_project_id     uuid NOT NULL REFERENCES service_projects(id) ON DELETE CASCADE,
  estatus                text NOT NULL DEFAULT 'pendiente',
  motivo_del_servicio    text,
  ubicacion              text,
  referencias            text,
  foja_de_ruta           text,
  comentarios_de_soporte text,
  fecha_hora_agendada    timestamptz,
  fecha_hora_limite      timestamptz,
  fecha_llegada          timestamptz,
  fecha_salida           timestamptz,
  fecha_fin              timestamptz,
  created_by             uuid REFERENCES users(id),
  created_at             timestamptz DEFAULT now() NOT NULL,
  archived_at            timestamptz NULL,
  CONSTRAINT service_orders_pkey PRIMARY KEY (id),
  CONSTRAINT service_orders_estatus_check
    CHECK (estatus IN ('pendiente','agendado','en_curso','atendido','cancelado'))
);
CREATE UNIQUE INDEX IF NOT EXISTS service_orders_number_key ON service_orders (number);
CREATE INDEX IF NOT EXISTS idx_service_orders_project ON service_orders (service_project_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_estatus ON service_orders (estatus);

-- 5. services (uno por unidad; service_order_id NULLABLE para walk-in taller/calle)
CREATE TABLE IF NOT EXISTS services (
  id                  uuid DEFAULT gen_random_uuid() NOT NULL,
  number              text NOT NULL,
  service_order_id    uuid REFERENCES service_orders(id) ON DELETE SET NULL,
  unidad_id           uuid REFERENCES unidades(id)       ON DELETE SET NULL,
  ruta_id             uuid REFERENCES rutas(id)          ON DELETE SET NULL,
  customer_id         uuid REFERENCES contacts(id)       ON DELETE SET NULL,
  estatus             text NOT NULL DEFAULT 'pendiente',
  motivo_visita       text,
  referencia          text,
  ubicacion           text,
  ubicacion_txt       text,
  reporte_tecnico     text,
  comentarios_reporte text,
  comentarios_soporte text,
  motivo_cancelacion  text,
  iniciado_por        uuid REFERENCES users(id),
  fecha_creado        timestamptz DEFAULT now() NOT NULL,
  fecha_hora_agendada timestamptz,
  fecha_hora_limite   timestamptz,
  fecha_hora_servicio timestamptz,
  archived_at         timestamptz NULL,
  CONSTRAINT services_pkey PRIMARY KEY (id),
  CONSTRAINT services_estatus_check
    CHECK (estatus IN ('pendiente','agendado','en_curso','atendido','cancelado','rechazado'))
);
CREATE UNIQUE INDEX IF NOT EXISTS services_number_key ON services (number);
CREATE INDEX IF NOT EXISTS idx_services_order    ON services (service_order_id);
CREATE INDEX IF NOT EXISTS idx_services_unidad   ON services (unidad_id);
CREATE INDEX IF NOT EXISTS idx_services_customer ON services (customer_id);
CREATE INDEX IF NOT EXISTS idx_services_estatus  ON services (estatus);

-- 6. service_technicians (N:M)
CREATE TABLE IF NOT EXISTS service_technicians (
  service_id  uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT service_technicians_pkey PRIMARY KEY (service_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_service_technicians_user ON service_technicians (user_id);

-- 7. service_requests (admin → soporte)
CREATE TABLE IF NOT EXISTS service_requests (
  id                          uuid DEFAULT gen_random_uuid() NOT NULL,
  requested_by                uuid NOT NULL REFERENCES users(id),
  assigned_to                 uuid REFERENCES users(id),
  customer_id                 uuid REFERENCES contacts(id) ON DELETE SET NULL,
  motivo                      text NOT NULL,
  status                      text NOT NULL DEFAULT 'pending',
  resolved_service_project_id uuid REFERENCES service_projects(id) ON DELETE SET NULL,
  created_at                  timestamptz DEFAULT now() NOT NULL,
  resolved_at                 timestamptz NULL,
  CONSTRAINT service_requests_pkey PRIMARY KEY (id),
  CONSTRAINT service_requests_status_check
    CHECK (status IN ('pending','approved','rejected','cancelled'))
);
CREATE INDEX IF NOT EXISTS idx_service_requests_status   ON service_requests (status);
CREATE INDEX IF NOT EXISTS idx_service_requests_assigned ON service_requests (assigned_to);
