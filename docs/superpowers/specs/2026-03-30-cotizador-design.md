# Cotizador App — Diseño

**Fecha:** 2026-03-30
**Estado:** Aprobado

---

## Contexto

App de cotizaciones empresariales con tres roles (admin, manager, sales), multimoneda (MXN/USD), generación de PDFs y auditoría de eventos. La base de datos PostgreSQL ya existe con el schema completo y seed data. Esta primera versión es un demo funcional.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 App Router |
| UI | React 19 + Tailwind CSS 4 |
| Auth | iron-session (cookie cifrada) |
| Base de datos | PostgreSQL vía `pg` (sin ORM) |
| PDF | @react-pdf/renderer |
| Passwords | bcryptjs |

---

## Base de Datos

**Conexión:**
```
DB_HOST=192.168.0.111
DB_PORT=3305
DB_NAME=cotizador
DB_USER=admin
DB_PASSWORD=admin
```

**Migración requerida** — agregar credenciales a la tabla `users`:
```sql
ALTER TABLE users
  ADD COLUMN username text UNIQUE NOT NULL,
  ADD COLUMN password_hash text NOT NULL;
```

---

## Autenticación

- Login con `username` + `password`
- Verificación con `bcryptjs` contra `password_hash`
- Sesión en cookie cifrada con `iron-session`: `{ userId, role }`
- Middleware de Next.js protege rutas y redirige según rol:
  - `sales` → `/quotes`
  - `manager` → `/manager`
  - `admin` → `/admin`
- Logout limpia la cookie

---

## Estructura de Carpetas

```
app/
  (auth)/
    login/page.tsx
  (app)/
    layout.tsx              ← layout con nav según rol
    quotes/
      page.tsx              ← lista de cotizaciones (sales)
      new/page.tsx          ← crear cotización
      [id]/page.tsx         ← editar/ver cotización
    manager/
      page.tsx              ← todas las cotizaciones + filtros
      [id]/page.tsx         ← detalle (confirmar/cancelar)
    admin/
      page.tsx              ← dashboard admin
      users/page.tsx
      products/page.tsx
      customers/page.tsx
      settings/page.tsx
  api/
    auth/
      login/route.ts
      logout/route.ts
    quotes/
      route.ts              ← GET list, POST create
      [id]/route.ts         ← GET, PATCH, DELETE
      [id]/state/route.ts   ← PATCH cambiar estado
    products/
      route.ts              ← GET list + búsqueda
    customers/route.ts
    taxes/route.ts
    settings/route.ts
    pdf/[id]/route.ts       ← GET genera y devuelve PDF
lib/
  db.ts                     ← pool pg
  session.ts                ← config iron-session
  queries/
    users.ts
    quotes.ts
    quote_lines.ts
    products.ts
    customers.ts
    taxes.ts
    settings.ts
middleware.ts               ← protección de rutas
```

---

## Pantallas por Rol

### Sales (`/quotes`)
- **Lista:** sus cotizaciones con estado, cliente, total, fecha de creación
- **Nueva cotización:** cliente, fecha, condiciones de pago, tipo de cambio snapshot
- **Editor:** agregar líneas (búsqueda por nombre/SKU + catálogo visual), ajustar precio manual, descuento por línea, impuesto por línea; secciones y notas
- **Acciones:** Guardar borrador, Enviar, Cancelar, Generar PDF

### Manager (`/manager`)
- Lista de todas las cotizaciones con filtros por estado y vendedor
- Vista de detalle (solo lectura)
- Acciones: Confirmar, Cancelar
- Dashboard: totales agrupados por estado

### Admin (`/admin`)
- **Usuarios:** crear, editar, desactivar (username, rol, contraseña)
- **Productos:** CRUD (SKU, nombre, moneda, costo, utilidad fija, factor)
- **Clientes:** CRUD (nombre)
- **Configuración global:** tipo de cambio MXN/USD
- **Impuestos:** CRUD (nombre, tasa)
- **Condiciones de pago:** CRUD

---

## Capa de Datos

Funciones tipadas por entidad en `lib/queries/`. Cada función recibe parámetros y devuelve resultados directamente sin abstracción extra.

```ts
// Ejemplo
export async function listQuotesByUser(userId: string): Promise<Quote[]>
export async function createQuote(data: CreateQuoteInput): Promise<Quote>
export async function updateQuoteState(id: string, state: QuoteState): Promise<void>
```

---

## Generación de PDF

- API Route `GET /api/pdf/[id]`
- Consulta la cotización completa con líneas, cliente y condiciones
- Genera PDF con `@react-pdf/renderer`
- Responde con `Content-Type: application/pdf` para descarga directa
- Accesible para sales (solo sus quotes) y manager/admin (todos)

---

## Seguridad

- Rutas `/api/*` y `/app/*` protegidas por middleware con validación de sesión
- Sales solo puede leer/escribir sus propias cotizaciones (filtro por `user_id` en queries — **nota:** agregar columna `user_id` a tabla `quotes`)
- Passwords hasheados con bcryptjs (nunca texto plano)
- Variables de entorno en `.env.local` (no en repositorio)

---

## Migraciones Adicionales Requeridas

```sql
-- Credenciales en users
ALTER TABLE users
  ADD COLUMN username text UNIQUE NOT NULL,
  ADD COLUMN password_hash text NOT NULL;

-- Relación quote → user (vendedor dueño)
ALTER TABLE quotes
  ADD COLUMN user_id uuid REFERENCES users(id);
```

---

## Fuera del Alcance (Demo)

- Notificaciones por email
- App móvil
- API pública / tokens de acceso externo
- Historial de versiones de PDF
- Internacionalización
