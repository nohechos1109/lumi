-- Migración: Fase 2 Servicios — extend files table + service_materials
-- Archivos almacenados en filesystem del host, tabla guarda referencia.

-- 1. files — extender tabla existente (tiene: id, entity, entity_id, url, bucket, key, mime)
--    Agregar columnas para almacenamiento local en filesystem.
ALTER TABLE files ADD COLUMN IF NOT EXISTS entity_type   text;
ALTER TABLE files ADD COLUMN IF NOT EXISTS filename      text;
ALTER TABLE files ADD COLUMN IF NOT EXISTS original_name text;
ALTER TABLE files ADD COLUMN IF NOT EXISTS mime_type     text;
ALTER TABLE files ADD COLUMN IF NOT EXISTS file_size     bigint DEFAULT 0;
ALTER TABLE files ADD COLUMN IF NOT EXISTS file_path     text;
ALTER TABLE files ADD COLUMN IF NOT EXISTS uploaded_by   uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE files ADD COLUMN IF NOT EXISTS created_at    timestamptz DEFAULT now();

-- Drop unique constraint on key (new files use file_path, not key)
DROP INDEX IF EXISTS files_key_key;

-- Relax NOT NULL on legacy columns so new file records (filesystem) work
ALTER TABLE files ALTER COLUMN provider DROP NOT NULL;
ALTER TABLE files ALTER COLUMN bucket DROP NOT NULL;
ALTER TABLE files ALTER COLUMN key DROP NOT NULL;
ALTER TABLE files ALTER COLUMN mime DROP NOT NULL;

-- Migrar datos existentes: copiar entity → entity_type, mime → mime_type
UPDATE files SET entity_type = entity WHERE entity_type IS NULL AND entity IS NOT NULL;
UPDATE files SET mime_type = mime WHERE mime_type IS NULL AND mime IS NOT NULL;

-- Index para búsqueda polimórfica por entity_type + entity_id
CREATE INDEX IF NOT EXISTS idx_files_entity_type_id
  ON files (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by
  ON files (uploaded_by);

-- 2. service_materials — materiales/productos consumidos en un servicio
CREATE TABLE IF NOT EXISTS service_materials (
  id          uuid DEFAULT gen_random_uuid() NOT NULL,
  service_id  uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity    numeric(10,2) NOT NULL DEFAULT 1,
  unit_price  numeric(14,2) NOT NULL DEFAULT 0,
  notes       text,
  created_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT service_materials_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_service_materials_service
  ON service_materials (service_id);
CREATE INDEX IF NOT EXISTS idx_service_materials_product
  ON service_materials (product_id);

ALTER TABLE service_materials
  ADD COLUMN IF NOT EXISTS quote_line_id uuid REFERENCES quote_lines(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_service_materials_quote_line
  ON service_materials (quote_line_id);
