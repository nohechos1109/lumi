@AGENTS.md

# db
`@db/01_schema.sql` y `@db/02_seed.sql` representan el estado actual de la base de datos en producción. **No modificar estos archivos.**

Para cualquier cambio de base de datos requerido durante el desarrollo, crear un archivo de migración con el patrón `@db/.*migration.*\.sql` (ej. `db/20260413_nombre_migration.sql`) que contenga únicamente el DDL incremental necesario (`ALTER TABLE`, `CREATE TABLE`, `CREATE INDEX`, etc.).

Estos archivos de migración se aplican sobre producción en el momento del deploy.


# Bug Fixes Log

## Hydration Error #418 (Resuelto)

**Problema:** `new Date().getFullYear()` en `app/(auth)/login/page.tsx` se ejecutaba tanto en SSR como en el cliente, causando un mismatch de hydration (React error #418).

**Solución aplicada:**
- `login/page.tsx`: El año del copyright ahora se calcula solo en el cliente via `useState` + `useEffect`, evitando el mismatch SSR/cliente.
- `ProjectsTable.tsx` y `QuotesTable.tsx`: Cálculos de filtros de fecha envueltos en `useMemo` para evitar recrear objetos `Date` innecesariamente en cada render.

**Patrón a seguir:** No usar `new Date()` directamente en el JSX de componentes que se renderizan en servidor. Usar `useEffect` para valores que dependen del entorno del cliente, o `suppressHydrationWarning` cuando sea apropiado.
