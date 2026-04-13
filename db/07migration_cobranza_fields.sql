-- Migration 07: Add ruta, unidad, observaciones to sale_notes
ALTER TABLE public.sale_notes
  ADD COLUMN IF NOT EXISTS ruta          text,
  ADD COLUMN IF NOT EXISTS unidad        text,
  ADD COLUMN IF NOT EXISTS observaciones text;
