-- Migration 14: Remove legacy text fields ruta and unidad from sale_notes.
-- These were replaced by the unit_id FK to the unidades table (migration 13).

ALTER TABLE sale_notes DROP COLUMN IF EXISTS ruta;
ALTER TABLE sale_notes DROP COLUMN IF EXISTS unidad;
