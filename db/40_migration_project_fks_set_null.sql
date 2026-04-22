-- Migración 40: permite borrar proyectos sin cascadear cotizaciones ni ventas
-- quotes.project_id y sales.project_id → ON DELETE SET NULL

ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_project_id_fkey;
ALTER TABLE quotes ADD CONSTRAINT quotes_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_project_id_fkey;
ALTER TABLE sales ADD CONSTRAINT sales_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
