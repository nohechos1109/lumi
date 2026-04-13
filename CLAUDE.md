@AGENTS.md

# Dev Server

This project runs exclusively via Docker on port 3000. The preview tool cannot attach to the running Docker container. **Verification is complete when `docker-compose up --build -d` exits successfully** — do not attempt `preview_start` as it will always fail with a port conflict.

# Bug Fixes Log

## Hydration Error #418 (Resuelto)

**Problema:** `new Date().getFullYear()` en `app/(auth)/login/page.tsx` se ejecutaba tanto en SSR como en el cliente, causando un mismatch de hydration (React error #418).

**Solución aplicada:**
- `login/page.tsx`: El año del copyright ahora se calcula solo en el cliente via `useState` + `useEffect`, evitando el mismatch SSR/cliente.
- `ProjectsTable.tsx` y `QuotesTable.tsx`: Cálculos de filtros de fecha envueltos en `useMemo` para evitar recrear objetos `Date` innecesariamente en cada render.

**Patrón a seguir:** No usar `new Date()` directamente en el JSX de componentes que se renderizan en servidor. Usar `useEffect` para valores que dependen del entorno del cliente, o `suppressHydrationWarning` cuando sea apropiado.
