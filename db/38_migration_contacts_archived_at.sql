-- Migración 38: agregar archived_at a contacts para soft-delete
-- Permite "archivar" clientes con dependencias (proyectos, cotizaciones, ventas, pagos)
-- sin romper los FKs existentes ni perder historial financiero.
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_archived_at ON contacts (archived_at) WHERE archived_at IS NULL;
