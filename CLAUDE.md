@AGENTS.md

# Dev Server

This project runs exclusively via Docker on port 3000. The preview tool cannot attach to the running Docker container. **Verification is complete when `docker-compose up --build -d` exits successfully** — do not attempt `preview_start` as it will always fail with a port conflict.

# db

`@db/01_schema.sql` y `@db/02_seed.sql` son la fuente de verdad del estado actual de producción. **No modificar estos archivos.**

Para cualquier cambio de base de datos requerido durante el desarrollo, crear un archivo de migración con el patrón `@db/NN_migration_nombre.sql` donde `NN` es el número consecutivo siguiente al último archivo existente en `db/` (ej. si el último es `13_migration_unidades_rutas.sql`, el siguiente es `14_migration_nombre.sql`). El archivo debe contener únicamente el DDL incremental necesario (`ALTER TABLE`, `CREATE TABLE`, `CREATE INDEX`, etc.). **No usar nombres basados en fechas** — el orden alfabético de los archivos determina el orden de ejecución en Docker.

Estos archivos de migración son los deltas pendientes y se aplican sobre producción en el momento del deploy. No asumir que un cambio está en producción hasta que se haga el deploy. Las migraciones deben ser seguras para datos existentes: usar `IF NOT EXISTS`, `IF EXISTS`, o equivalentes según corresponda.

Durante el desarrollo se corre Docker localmente para pruebas — esto **no es un deploy real**. No confundir el entorno local con producción.

# Bug Fixes Log

## Hydration Error #418 (Resuelto)

**Problema:** `new Date().getFullYear()` en `app/(auth)/login/page.tsx` se ejecutaba tanto en SSR como en el cliente, causando un mismatch de hydration (React error #418).

**Solución aplicada:**
- `login/page.tsx`: El año del copyright ahora se calcula solo en el cliente via `useState` + `useEffect`, evitando el mismatch SSR/cliente.
- `ProjectsTable.tsx` y `QuotesTable.tsx`: Cálculos de filtros de fecha envueltos en `useMemo` para evitar recrear objetos `Date` innecesariamente en cada render.

**Patrón a seguir:** No usar `new Date()` directamente en el JSX de componentes que se renderizan en servidor. Usar `useEffect` para valores que dependen del entorno del cliente, o `suppressHydrationWarning` cuando sea apropiado.

# Icons & Visual Elements

**No usar emojis en la UI.** Siempre usar SVG inline para íconos — nunca caracteres Unicode emoji (💰, ✅, ❌, etc.). Esto aplica a botones, badges, tooltips, labels, y cualquier texto visible en la interfaz.
