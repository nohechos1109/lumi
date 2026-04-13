# Plan de Implementación — 5 Nuevas Features

**Fecha:** 2026-04-07
**Proyecto:** Cotizador App (Next.js 16 + PostgreSQL)

---

## Feature 1: Aprobación de Descuentos (Sales → Admin) + Notificaciones

### Contexto actual
- Los descuentos se aplican como líneas `display_type = 'discount'` con `discount_percent`.
- Cualquier usuario con acceso a la cotización puede agregar descuentos sin restricción.
- No existe sistema de notificaciones persistentes; solo hay toasts en cliente (`lib/toast.ts`).

### Diseño propuesto

#### 1.1 Nueva tabla `discount_approvals`
```sql
CREATE TABLE discount_approvals (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id      uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  quote_line_id uuid NOT NULL REFERENCES quote_lines(id) ON DELETE CASCADE,
  requested_by  uuid NOT NULL REFERENCES users(id),
  discount_percent numeric(5,2) NOT NULL,
  status        text NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  reviewed_by   uuid REFERENCES users(id),
  reviewed_at   timestamptz,
  created_at    timestamptz DEFAULT now() NOT NULL
);
```

#### 1.2 Nueva tabla `notifications`
```sql
CREATE TABLE notifications (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        text NOT NULL,       -- 'discount_request' | 'discount_approved' | 'discount_rejected'
  title       text NOT NULL,
  message     text,
  entity      text,                -- 'quote', 'discount_approval', etc.
  entity_id   uuid,
  read        boolean DEFAULT false,
  created_at  timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);
```

#### 1.3 Flujo de negocio
1. **Sales** agrega descuento → se crea la línea de descuento en estado "pendiente" (nuevo campo `approval_status` en `quote_lines` o se mantiene en `discount_approvals`).
2. Se crea registro en `discount_approvals` con `status = 'pending'`.
3. Se crea `notification` para todos los usuarios con `role = 'admin'` (tipo `discount_request`).
4. **Admin** ve la notificación → navega a la cotización → aprueba o rechaza.
5. Al aprobar: se aplica el descuento normalmente (se recalculan totales con `updateQuoteTotals`).
6. Al rechazar: se elimina la línea de descuento o se marca como rechazada.
7. Se crea `notification` para el vendedor que solicitó (tipo `discount_approved` o `discount_rejected`).

#### 1.4 Cambios en quote_lines
Agregar campo opcional:
```sql
ALTER TABLE quote_lines ADD COLUMN discount_approval_status text DEFAULT 'approved';
-- Valores: 'approved' (default para líneas existentes), 'pending', 'rejected'
```
- Las líneas con `discount_approval_status = 'pending'` NO se incluyen en `updateQuoteTotals`.
- En el UI se muestran con un badge "Pendiente de aprobación" y estilo atenuado.

#### 1.5 API endpoints nuevos
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/api/notifications` | Todos | Listar notificaciones del usuario |
| PATCH | `/api/notifications/[id]` | Todos | Marcar como leída |
| PATCH | `/api/notifications/read-all` | Todos | Marcar todas como leídas |
| GET | `/api/discount-approvals` | admin | Listar solicitudes pendientes |
| PATCH | `/api/discount-approvals/[id]` | admin | Aprobar o rechazar |

#### 1.6 Cambios en endpoints existentes
- `POST /api/quotes/[id]/lines` → cuando `display_type = 'discount'` y `session.role === 'sales'`:
  - Crear la línea con `discount_approval_status = 'pending'`
  - Crear `discount_approval` con `status = 'pending'`
  - Crear notificaciones para admins
  - NO recalcular totales hasta aprobación

#### 1.7 Componentes UI
- **NotificationBell** (sidebar/navbar): ícono de campana con badge de conteo de no leídas, dropdown con lista.
- **NotificationDropdown**: lista de notificaciones con links a la entidad relevante.
- **DiscountApprovalBadge** (en LineEditor): badge visual en líneas de descuento pendientes.
- **DiscountApprovalPanel** (admin): panel/modal para revisar y aprobar/rechazar descuentos. Accesible desde la notificación o desde la cotización directamente.

#### 1.8 Archivos a crear/modificar
**Crear:**
- `lib/queries/notifications.ts`
- `lib/queries/discount-approvals.ts`
- `app/api/notifications/route.ts`
- `app/api/notifications/[id]/route.ts`
- `app/api/notifications/read-all/route.ts`
- `app/api/discount-approvals/route.ts`
- `app/api/discount-approvals/[id]/route.ts`
- `components/ui/NotificationBell.tsx`
- `components/ui/NotificationDropdown.tsx`

**Modificar:**
- `db/init/cotizador.sql` — agregar tablas
- `lib/queries/quote_lines.ts` — lógica de approval_status
- `lib/queries/quotes.ts` — excluir líneas pending del cálculo de totales
- `app/api/quotes/[id]/lines/route.ts` — crear approval al agregar descuento como sales
- `app/(app)/quotes/[id]/_components/LineEditor.tsx` — badge + UI de pendiente
- `app/(app)/layout.tsx` — agregar NotificationBell al sidebar

---

## Feature 2: Modal para Crear/Modificar Plantillas

### Contexto actual
- Las plantillas se muestran en `PlantillaModal.tsx` solo en modo lectura para seleccionar y aplicar a cotizaciones.
- La tabla `plantillas` y `plantilla_items` están pobladas por seed data.
- No existe UI de CRUD para plantillas; los endpoints existentes son solo GET.

### Diseño propuesto

#### 2.1 API endpoints nuevos
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| POST | `/api/plantillas` | admin | Crear plantilla |
| PATCH | `/api/plantillas/[id]` | admin | Actualizar nombre/requerimiento |
| DELETE | `/api/plantillas/[id]` | admin | Eliminar plantilla y sus items |
| POST | `/api/plantillas/[id]/items` | admin | Agregar item a plantilla |
| PATCH | `/api/plantillas/[id]/items/[seq]` | admin | Actualizar item (qty, product) |
| DELETE | `/api/plantillas/[id]/items/[seq]` | admin | Eliminar item |
| POST | `/api/plantillas/[id]/items/reorder` | admin | Reordenar items |

#### 2.2 Queries nuevas
- `lib/queries/plantillas.ts` — CRUD completo: `createPlantilla`, `updatePlantilla`, `deletePlantilla`, `addPlantillaItem`, `updatePlantillaItem`, `removePlantillaItem`, `reorderPlantillaItems`.

#### 2.3 Componente: `PlantillaEditorModal`
Nuevo modal con dos modos:
- **Crear**: formulario vacío, campo nombre + requerimiento + buscador de productos para agregar items.
- **Editar**: pre-cargado con datos existentes, permite modificar nombre, requerimiento, agregar/quitar/reordenar items.

Estructura del modal:
- Header: título "Nueva Plantilla" / "Editar Plantilla: {nombre}"
- Sección superior: inputs de nombre y requerimiento (descripción)
- Sección inferior: tabla de items con columnas (secuencia, producto, cantidad, acciones)
- Botón para agregar producto (abre buscador de productos, reutilizando lógica de `LineEditor`)
- Drag-and-drop para reordenar items
- Footer: botones Cancelar / Guardar

#### 2.4 Página de administración de plantillas
Crear nueva página `/app/(app)/admin/plantillas/page.tsx`:
- Lista de plantillas con nombre, cantidad de items, requerimiento
- Botones: crear nueva, editar, eliminar (con confirmación)
- Agregar a navegación de admin

#### 2.5 Archivos a crear/modificar
**Crear:**
- `lib/queries/plantillas.ts`
- `app/api/plantillas/route.ts` (agregar POST)
- `app/api/plantillas/[id]/route.ts` (agregar PATCH, DELETE)
- `app/api/plantillas/[id]/items/route.ts`
- `app/api/plantillas/[id]/items/[seq]/route.ts`
- `app/api/plantillas/[id]/items/reorder/route.ts`
- `app/(app)/admin/plantillas/page.tsx`
- `components/ui/PlantillaEditorModal.tsx`

**Modificar:**
- `app/(app)/layout.tsx` — agregar "Plantillas" al nav de admin
- `db/init/cotizador.sql` — agregar PK a `plantilla_items` si hace falta

---

## Feature 3: Catálogo de Productos (Solo Lectura) para Ventas

### Contexto actual
- Los productos se gestionan en `/admin/products` (solo admin).
- El perfil sales solo ve productos a través del buscador al agregar líneas a cotizaciones.
- Los campos de pricing visible en admin: `cost_base`, `utility_fixed`, `utility_factor`, `currency`.

### Diseño propuesto

#### 3.1 API endpoint
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/api/products/catalog` | sales, manager, admin | Lista productos con precio final calculado (con y sin IVA), sin campos de costo/utilidad |

**Respuesta del endpoint:**
```typescript
interface CatalogProduct {
  id: string
  sku: string
  name: string
  description: string | null
  category: string | null
  currency: string
  image_url: string | null
  codigo_sat: string | null
  // Campos calculados:
  price_without_tax: number   // (cost_base * utility_factor) + utility_fixed
  price_with_tax: number      // price_without_tax * 1.16
}
```
**Nota:** No se exponen `cost_base`, `utility_fixed`, `utility_factor`.

#### 3.2 Query nueva
`lib/queries/products.ts` → agregar función `listProductsCatalog(fxRate)`:
```sql
SELECT id, sku, name, description, category, currency, image_url, codigo_sat,
       (cost_base * utility_factor + utility_fixed) AS price_without_tax,
       (cost_base * utility_factor + utility_fixed) * 1.16 AS price_with_tax
FROM products
ORDER BY category, name
```
Para productos en USD, multiplicar por el tipo de cambio vigente.

#### 3.3 Página para ventas
Crear `/app/(app)/catalog/page.tsx`:
- Vista de lista y cuadrícula (similar a admin/products pero read-only)
- Búsqueda por nombre, SKU, categoría
- Filtro por categoría y moneda
- Cada tarjeta/fila muestra: imagen, nombre, SKU, categoría, precio sin IVA, precio con IVA
- **Sin** acciones de editar/eliminar
- **Sin** columnas de costo base, utilidad fija, factor de utilidad

#### 3.4 Archivos a crear/modificar
**Crear:**
- `app/(app)/catalog/page.tsx`
- `app/api/products/catalog/route.ts`

**Modificar:**
- `lib/queries/products.ts` — agregar `listProductsCatalog`
- `app/(app)/layout.tsx` — agregar "Catálogo" al nav de sales

---

## Feature 4: Gestión de Clientes para Ventas

### Contexto actual
- Los clientes se gestionan solo en `/admin/customers` (exclusivo para admin).
- Sales solo puede seleccionar clientes existentes al crear cotizaciones (o crear uno nuevo inline).
- No hay restricción de eliminación; admin puede borrar directamente.

### Diseño propuesto

#### 4.1 API endpoints para ventas
Reutilizar los endpoints existentes de `/api/customers` con lógica de roles:
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/api/customers` | todos | Listar clientes (ya existe) |
| POST | `/api/customers` | todos | Crear cliente (ya existe) |
| PATCH | `/api/customers/[id]` | todos | Editar cliente (**nuevo**) |
| DELETE | `/api/customers/[id]` | admin, manager | Eliminar cliente (restringido) |

Para la solicitud de eliminación por sales:
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| POST | `/api/customers/[id]/delete-request` | sales | Solicitar eliminación |
| GET | `/api/delete-requests` | admin, manager | Ver solicitudes pendientes |
| PATCH | `/api/delete-requests/[id]` | admin, manager | Aprobar/rechazar solicitud |

#### 4.2 Nueva tabla `delete_requests`
```sql
CREATE TABLE delete_requests (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  entity        text NOT NULL,      -- 'customer'
  entity_id     uuid NOT NULL,
  requested_by  uuid NOT NULL REFERENCES users(id),
  reason        text,
  status        text NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  reviewed_by   uuid REFERENCES users(id),
  reviewed_at   timestamptz,
  created_at    timestamptz DEFAULT now() NOT NULL
);
```

#### 4.3 Página para ventas
Crear `/app/(app)/customers/page.tsx`:
- Tabla de clientes con búsqueda por nombre, email, teléfono
- Botón "Nuevo Cliente" → modal de creación
- Botón "Editar" por fila → modal de edición
- Botón "Solicitar Eliminación" → modal de confirmación con campo de razón → crea delete_request + notificación para admin/manager
- **Sin** botón de eliminar directo

#### 4.4 Componentes
- Reutilizar el patrón de modal de `admin/customers` pero sin opción de delete directo
- `CustomerFormModal` (compartido entre admin y sales, con prop `canDelete`)
- `DeleteRequestModal` (nuevo, para sales: campo de razón)

#### 4.5 Integración con notificaciones
- Al crear `delete_request` → notificación a admins y managers
- Al aprobar/rechazar → notificación al vendedor solicitante
- Reutiliza la tabla `notifications` de Feature 1

#### 4.6 Archivos a crear/modificar
**Crear:**
- `app/(app)/customers/page.tsx`
- `app/api/customers/[id]/route.ts` (PATCH para todos, DELETE solo admin/manager)
- `app/api/customers/[id]/delete-request/route.ts`
- `app/api/delete-requests/route.ts`
- `app/api/delete-requests/[id]/route.ts`
- `lib/queries/delete-requests.ts`
- `components/ui/DeleteRequestModal.tsx`

**Modificar:**
- `lib/queries/customers.ts` — agregar `updateCustomer` a nivel general (ya existe en admin)
- `app/(app)/layout.tsx` — agregar "Clientes" al nav de sales
- `db/init/cotizador.sql` — agregar tabla `delete_requests`

---

## Feature 5: Duplicar Cotizaciones

### Contexto actual
- Las cotizaciones se crean via `POST /api/quotes` generando folio `COT-YYYYMMDD-XXXX`.
- Las líneas se agregan individualmente o en batch (`/lines/batch`).
- No existe funcionalidad de duplicación.

### Diseño propuesto

#### 5.1 API endpoint
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| POST | `/api/quotes/[id]/duplicate` | todos | Duplicar cotización completa |

**Body del request:**
```typescript
{
  project_id?: string | null  // ID del proyecto destino (null = sin proyecto)
}
```
- Si no se envía `project_id`, se mantiene el proyecto original.
- Si se envía `project_id` con un UUID, se asigna al nuevo proyecto.
- Si se envía `project_id: null`, la copia queda sin proyecto.

#### 5.2 Lógica de duplicación
```typescript
async function duplicateQuote(quoteId: string, userId: string, targetProjectId?: string | null): Promise<Quote> {
  // 1. Obtener cotización original con todas sus líneas
  const original = await getQuote(quoteId)
  const lines = await listLines(quoteId)

  // 2. Determinar proyecto destino
  // Si targetProjectId fue explícitamente proporcionado, usarlo; si no, mantener el original
  const projectId = targetProjectId !== undefined ? targetProjectId : original.project_id

  // 3. Crear nueva cotización con folio nuevo (COT-YYYYMMDD-XXXX)
  const newQuote = await createQuote({
    customer_id: original.customer_id,
    payment_term_id: original.payment_term_id,
    quotation_date: new Date().toISOString(),  // Fecha actual
    expiration_date: null,                      // Sin expiración (se puede ajustar después)
    fx_mxn_per_usd_snapshot: original.fx_mxn_per_usd_snapshot,
    description: original.description,
    unit_count: original.unit_count,
    terms: original.terms,
    user_id: userId,                            // Asignar al usuario que duplica
    project_id: projectId,                      // Proyecto destino elegido por el usuario
  })
  // Estado: 'draft' (por defecto en createQuote)

  // 3. Copiar todas las líneas (productos, secciones, notas, descuentos)
  for (const line of lines) {
    await pool.query(`
      INSERT INTO quote_lines
        (quote_id, sequence, display_type, product_id, name, qty,
         discount_percent, currency_snapshot, cost_base_snapshot,
         utility_fixed_snapshot, utility_factor_snapshot, fx_snapshot,
         unit_price_mxn_suggested, unit_price_mxn_manual,
         unit_price_mxn_effective, subtotal, tax_amount, total, margin_amount)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
    `, [newQuote.id, line.sequence, line.display_type, line.product_id,
        line.name, line.qty, line.discount_percent, line.currency_snapshot,
        line.cost_base_snapshot, line.utility_fixed_snapshot,
        line.utility_factor_snapshot, line.fx_snapshot,
        line.unit_price_mxn_suggested, line.unit_price_mxn_manual,
        line.unit_price_mxn_effective, line.subtotal, line.tax_amount,
        line.total, line.margin_amount])
  }

  // 4. Recalcular totales
  await updateQuoteTotals(newQuote.id)

  return newQuote
}
```

#### 5.3 Comportamiento clave
- **Folio**: se genera uno completamente nuevo con la fecha del día actual.
- **Estado**: siempre `draft`.
- **Fecha de cotización**: fecha actual (no la original).
- **Fecha de expiración**: null (el vendedor la establece manualmente).
- **Usuario**: se asigna al usuario que ejecuta la acción.
- **Líneas**: se copian todas las líneas con sus snapshots de precios.
- **Proyecto**: se mantiene el mismo proyecto de la cotización original.
- **Versión**: 1 (es una cotización nueva).

#### 5.4 UI

**Botón:** Agregar botón "Duplicar" en `QuoteActions.tsx` (junto a "Exportar PDF"). Disponible en cualquier estado de la cotización original.

**Modal de duplicación (`DuplicateQuoteModal`):**
Al hacer clic en "Duplicar" se abre un modal con las siguientes opciones:
1. **"Mismo proyecto"** (preseleccionado) — muestra el nombre del proyecto actual.
2. **"Otro proyecto"** — despliega un selector con los proyectos disponibles del usuario.
3. **"Sin proyecto"** — la copia queda sin asociar a ningún proyecto.

Botones del modal: "Cancelar" / "Duplicar"

**Flujo:**
1. Clic en "Duplicar" → se abre el modal.
2. El usuario elige dónde colocar la copia.
3. Clic en "Duplicar" del modal → llamada API con `project_id` según la selección.
4. Redirigir a la nueva cotización.
5. Toast de confirmación: "Cotización duplicada: {nuevo_folio}"

**Nota:** Si la cotización original no tiene proyecto, el modal solo muestra las opciones "Seleccionar proyecto" y "Sin proyecto".

#### 5.5 Archivos a crear/modificar
**Crear:**
- `app/api/quotes/[id]/duplicate/route.ts`
- `components/ui/DuplicateQuoteModal.tsx` — modal con selector de proyecto

**Modificar:**
- `lib/queries/quotes.ts` — agregar función `duplicateQuote(quoteId, userId, targetProjectId?)`
- `app/(app)/quotes/[id]/_components/QuoteActions.tsx` — agregar botón "Duplicar" + abrir modal

---

## Feature 6: Bloquear Precio Unitario para Vendedores

### Contexto actual
- En `LineEditor.tsx`, el campo `unit_price_mxn_manual` es editable para todos los roles.
- Cualquier usuario puede cambiar el precio unitario sugerido escribiendo un precio manual.
- Esto permite que un vendedor baje el precio sin control.

### Diseño propuesto

#### 6.1 Cambio en LineEditor
- Si `role === 'sales'`, el campo de precio unitario se vuelve **solo lectura**.
- Se muestra el precio sugerido (`unit_price_mxn_suggested`) como valor fijo.
- Se oculta o deshabilita el input de `unit_price_mxn_manual`.
- Admin y manager siguen pudiendo editar el precio libremente.

#### 6.2 Validación en backend
- En `PATCH /api/quotes/[id]/lines/[lineId]`:
  - Si `session.role === 'sales'` y el body incluye `unit_price_mxn_manual`, rechazar con 403.
  - Esto previene que un vendedor manipule el precio vía API directamente.

#### 6.3 Archivos a modificar
- `app/(app)/quotes/[id]/_components/LineEditor.tsx` — condicional de read-only en precio por rol
- `app/api/quotes/[id]/lines/[lineId]/route.ts` — validación de backend

---

## Feature 7: Botón para Limpiar Cotización

### Contexto actual
- Para borrar todas las líneas de una cotización, hay que eliminarlas una por una.
- No existe endpoint ni UI para limpiar todas las líneas de golpe.

### Diseño propuesto

#### 7.1 API endpoint
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| DELETE | `/api/quotes/[id]/lines` | todos (con permisos sobre la cotización) | Eliminar todas las líneas de la cotización |

#### 7.2 Lógica
```typescript
// Solo permitir en cotizaciones en estado 'draft'
// Verificar que el usuario tenga acceso (sales: solo propias)
await pool.query('DELETE FROM quote_lines WHERE quote_id = $1', [quoteId])
await updateQuoteTotals(quoteId) // Resetea totales a 0
```

#### 7.3 UI
- Botón "Limpiar Cotización" en `LineEditor.tsx` o en `QuoteActions.tsx`.
- Solo visible cuando la cotización está en estado `draft`.
- Confirmación obligatoria: modal "¿Seguro que deseas eliminar todas las líneas? Esta acción no se puede deshacer."
- Tras confirmar, se llama al endpoint y se recarga la lista de líneas.
- Toast: "Cotización limpiada exitosamente"

#### 7.4 Archivos a crear/modificar
**Crear:**
- Ruta DELETE en `app/api/quotes/[id]/lines/route.ts` (agregar handler DELETE al archivo existente)

**Modificar:**
- `app/(app)/quotes/[id]/_components/LineEditor.tsx` — botón + modal de confirmación
- `app/(app)/quotes/[id]/_components/QuoteActions.tsx` — alternativa: colocar el botón aquí

---

## Feature 8: Detalles para la Instalación + Levantamiento PDF

**Fecha:** 2026-04-08

### Contexto
- Se implementó el botón "Levantamiento PDF" que genera un PDF sin precios (solo descripción y cantidad) con un campo libre "DETALLES PARA LA INSTALACIÓN".
- El flujo actual requiere ingresar los detalles cada vez en el modal antes de generar el PDF.
- Se solicita un campo persistente en la cotización para almacenar esos detalles de instalación, pre-llenando el modal automáticamente.

### Diseño propuesto

#### 8.1 Columna nueva en `quotes`
```sql
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS installation_notes TEXT DEFAULT NULL;
```

#### 8.2 Migration endpoint
`GET /api/migrate/add-installation-notes` — ejecuta el `ALTER TABLE` de forma idempotente.

#### 8.3 Cambios en `lib/queries/quotes.ts`
- Agregar `installation_notes: string | null` al interface `Quote`.
- Extender `updateQuoteFields` para aceptar y persistir `installation_notes`.

#### 8.4 Cambios en `app/api/quotes/[id]/route.ts`
- En el handler `PATCH`: leer `body.installation_notes` y pasarlo a `updateQuoteFields`.

#### 8.5 Nuevo componente `InstallationNotesEditor.tsx`
Similar a `DescriptionEditor.tsx` pero:
- Usa `<textarea>` (multilinea) en lugar de `<input type="text">`.
- Label: "Detalles para la instalación".
- Click-to-edit inline; guarda con `PATCH /api/quotes/[id]` al perder foco o presionar `Ctrl+Enter`.
- Muestra placeholder dashed cuando está vacío.
- Disponible independientemente del estado de la cotización (no solo en draft).

#### 8.6 Cambios en `app/(app)/quotes/[id]/page.tsx`
Reemplaza el `<DescriptionEditor>` solitario por un flex-row de 2 columnas:
```
[ Descripción general (izq, ~50%) ] [ Detalles para la instalación (der, ~50%) ]
```
Pasa `quote.installation_notes` como prop a `<QuoteActions>`.

#### 8.7 Cambios en `QuoteActions.tsx`
- Nueva prop: `installationNotes?: string | null`.
- Se la pasa al `<LevantamientoModal>` al abrirlo.

#### 8.8 Cambios en `LevantamientoModal.tsx`
- Nueva prop: `installationNotes?: string | null`.
- El `useState` del textarea se inicializa con `installationNotes ?? ''`.
- Los cambios en el modal son solo para esa sesión de generación de PDF (no escriben de regreso a la BD).

#### 8.9 Archivos a crear/modificar
**Crear:**
- `app/api/migrate/add-installation-notes/route.ts`
- `app/(app)/quotes/[id]/_components/InstallationNotesEditor.tsx`

**Modificar:**
- `lib/queries/quotes.ts` — interface Quote + updateQuoteFields
- `app/api/quotes/[id]/route.ts` — PATCH handler
- `app/(app)/quotes/[id]/page.tsx` — layout 2 columnas + pasar prop a QuoteActions
- `app/(app)/quotes/[id]/_components/QuoteActions.tsx` — prop installationNotes
- `components/ui/LevantamientoModal.tsx` — pre-poblar textarea
- `db/init/schema.sql` — agregar columna en definición de tabla quotes

---

## Orden de Implementación Sugerido

| Prioridad | Feature | Razón | Dependencias |
|-----------|---------|-------|-------------|
| 1 | **Feature 6** — Bloquear precio unitario (ventas) | Cambio mínimo, alto impacto en control | Ninguna |
| 2 | **Feature 7** — Limpiar cotización | Cambio pequeño, calidad de vida | Ninguna |
| 3 | **Feature 5** — Duplicar cotizaciones | Sencilla, alto valor | Ninguna |
| 4 | **Feature 8** — Detalles instalación + Levantamiento PDF | Campo persistente para levantamiento | Ninguna |
| 5 | **Feature 1** — Notificaciones + Aprobación de descuentos | Infraestructura base para Feature 4 | Ninguna |
| 6 | **Feature 3** — Catálogo de productos (ventas) | Independiente, relativamente simple | Ninguna |
| 7 | **Feature 4** — Gestión de clientes (ventas) | Usa notificaciones de Feature 1 | Feature 1 |
| 8 | **Feature 2** — CRUD de plantillas | Más compleja en UI | Ninguna |

---

## Resumen de Cambios en Base de Datos

### Tablas nuevas
1. `notifications` — notificaciones persistentes por usuario
2. `discount_approvals` — solicitudes de aprobación de descuento
3. `delete_requests` — solicitudes de eliminación de entidades

### Columnas nuevas
1. `quote_lines.discount_approval_status` — estado de aprobación del descuento
2. `quotes.installation_notes` — notas/detalles para la instalación (Feature 8)

### Índices nuevos
1. `idx_notifications_user` en `notifications(user_id, read, created_at DESC)`
2. Índices en `discount_approvals(quote_id)` y `delete_requests(entity, entity_id)`

---

## Resumen de Cambios en Navegación

```typescript
// layout.tsx → navItems actualizado
const navItems = {
  sales: [
    { href: '/projects',   label: 'Proyectos' },
    { href: '/quotes',     label: 'Mis Cotizaciones' },
    { href: '/catalog',    label: 'Catálogo' },       // NUEVO
    { href: '/customers',  label: 'Clientes' },       // NUEVO
  ],
  manager: [
    { href: '/projects',   label: 'Proyectos' },
    { href: '/quotes',     label: 'Cotizaciones' },
    { href: '/manager',    label: 'Equipo' },
  ],
  admin: [
    { href: '/admin',            label: 'Dashboard' },
    { href: '/projects',         label: 'Proyectos' },
    { href: '/admin/users',      label: 'Usuarios' },
    { href: '/admin/products',   label: 'Productos' },
    { href: '/admin/plantillas', label: 'Plantillas' },  // NUEVO
    { href: '/admin/customers',  label: 'Clientes' },
    { href: '/admin/settings',   label: 'Configuración' },
  ],
}
```
