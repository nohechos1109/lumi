-- Migration: Unidades y Rutas
-- Adds fleet management tables and links them to projects and sale notes.

-- 1. Tabla rutas
CREATE TABLE IF NOT EXISTS rutas (
  id         uuid DEFAULT gen_random_uuid() NOT NULL,
  name       text NOT NULL,
  cliente_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT rutas_pkey PRIMARY KEY (id)
);
ALTER TABLE rutas ADD COLUMN IF NOT EXISTS cliente_id uuid REFERENCES contacts(id) ON DELETE SET NULL;

-- 2. Tabla unidades
CREATE TABLE IF NOT EXISTS unidades (
  id                      uuid DEFAULT gen_random_uuid() NOT NULL,
  name                    text NOT NULL,
  ruta_id                 uuid REFERENCES rutas(id) ON DELETE SET NULL,
  empresa_id              uuid REFERENCES contacts(id) ON DELETE SET NULL,
  dueno_id                uuid REFERENCES contacts(id) ON DELETE SET NULL,
  dashcam                 text,
  pantalla                boolean DEFAULT false NOT NULL,
  impresora               boolean DEFAULT false NOT NULL,
  reversa                 boolean DEFAULT false NOT NULL,
  reconocimiento_facial   boolean DEFAULT false NOT NULL,
  fecha_instalacion       date,
  descripcion_instalacion text,
  observaciones           text,
  created_at              timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT unidades_pkey PRIMARY KEY (id),
  CONSTRAINT unidades_dashcam_check CHECK (dashcam IS NULL OR dashcam IN ('dashcam', 'streamax'))
);

-- 4. Vincular proyectos a una ruta (opcional; requerida para confirmar cotizacion vinculada)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ruta_id uuid REFERENCES rutas(id) ON DELETE SET NULL;

-- 5. sale_notes: FK a unidades (el campo text 'unidad' y 'ruta' quedan como legado)
ALTER TABLE sale_notes ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES unidades(id) ON DELETE SET NULL;

-- 6. sale_note_lines: rastrear de cuál línea de cotización proviene cada línea de nota
ALTER TABLE sale_note_lines ADD COLUMN IF NOT EXISTS quote_line_id uuid REFERENCES quote_lines(id) ON DELETE SET NULL;
