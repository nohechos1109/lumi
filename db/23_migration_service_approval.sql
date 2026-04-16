-- Migración: Fase 3 Servicios — aprobación + generación automática de nota
-- Permite crear ventas sin cotización (servicios walk-in/manual).

-- 1. sales.quote_id nullable — ventas por servicio no necesitan cotización
ALTER TABLE sales ALTER COLUMN quote_id DROP NOT NULL;

-- 1b. sales.customer_id nullable — walk-in services may lack customer
ALTER TABLE sales ALTER COLUMN customer_id DROP NOT NULL;

-- 2. sale_notes.service_id — trazar nota generada desde servicio
ALTER TABLE sale_notes ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES services(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_sale_notes_service ON sale_notes (service_id);

-- 3. services: campos de aprobación
ALTER TABLE services ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE services ADD COLUMN IF NOT EXISTS sale_note_id uuid REFERENCES sale_notes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_services_approved_by ON services (approved_by);
CREATE INDEX IF NOT EXISTS idx_services_sale_note ON services (sale_note_id);
