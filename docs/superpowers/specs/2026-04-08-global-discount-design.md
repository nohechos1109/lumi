# Descuento Global — Diseño

**Fecha:** 2026-04-08  
**Estado:** Aprobado  

## Contexto

El sistema de cotizaciones ya soporta líneas de tipo `display_type = 'discount'` que funcionan como descuento global sobre el subtotal de productos. Estas líneas pasan por el flujo de aprobación existente (requieren aprobación de admin o manager). El problema actual es que no hay límite de cuántas líneas de descuento global puede tener una cotización, y no aparecen de forma destacada en la sección de totales del cotizador ni del PDF.

## Objetivo

- Limitar a **un solo descuento global** por cotización.
- Mostrar el descuento siempre **al fondo** de la tabla de líneas (no draggable).
- Mostrarlo explícitamente en la **sección de totales** del cotizador y del PDF.

## Opción elegida: A — Lógica de app (API + UI)

Sin migración de BD. Todo se maneja en API y capa de presentación.

---

## Diseño por componente

### 1. API — Enforcement de unicidad

**Archivo:** `app/api/quotes/[id]/lines/route.ts` (POST)

Antes de insertar una línea con `display_type = 'discount'`, ejecutar:

```sql
SELECT COUNT(*) FROM quote_lines WHERE quote_id = $1 AND display_type = 'discount'
```

Si el resultado es ≥ 1, retornar:

```
HTTP 400 Bad Request
{ "error": "Ya existe un descuento global en esta cotización" }
```

**Nota sobre "activa":** La verificación aplica a cualquier fila existente en `quote_lines` independientemente de `discount_approval_status` (NULL, `'pending'`, o `'approved'`). Esto es correcto porque cuando un admin **rechaza** un descuento, la ruta de aprobación elimina físicamente la `quote_line`. Por lo tanto, después de un rechazo no existe ninguna fila y el usuario puede solicitar un nuevo descuento normalmente. El check de unicidad no bloquea este caso.

No se modifica ninguna otra ruta.

---

### 2. Query — Ordenamiento

**Archivo:** `lib/queries/quotes.ts` → función `listLines`

Modificar el `ORDER BY` actual (`ORDER BY ql.sequence`) a:

```sql
ORDER BY
  CASE WHEN ql.display_type = 'discount' THEN 1 ELSE 0 END ASC,
  ql.sequence ASC
```

Esto garantiza que la línea de descuento siempre aparezca al fondo. El cliente (`LineEditor`) usa el array tal como lo devuelve la API, por lo que no se requiere sort adicional en el frontend.

---

### 3. UI — Sección de totales del cotizador

**Archivo:** `app/(app)/quotes/[id]/_components/LineEditor.tsx`

La sección de totales se ubica en el footer del `LineEditor` (ya existente, líneas ~517–557), **no** en `page.tsx` (que no recibe líneas en el servidor).

Agregar una fila "Descuento Global" en el footer de totales, entre el subtotal de productos y el IVA:
- Solo se renderiza si existe en el array `lines` una línea con `display_type === 'discount'` y cuyo estado no sea `'pending'` (condición: `COALESCE(discount_approval_status, 'approved') !== 'pending'`).
- Muestra el porcentaje (`discount_percent`) y el monto en negativo (`subtotal`).
- **Importante:** `amount_untaxed` ya incluye el descuento aprobado (lo calcula `updateQuoteTotals`). Esta fila es puramente informativa — no restar el descuento nuevamente.

Si el descuento está pendiente, ya aparece en la tabla de líneas con el indicador de estado actual y no se agrega en el footer.

---

### 4. LineEditor — Deshabilitar drag en línea de descuento

**Archivo:** `app/(app)/quotes/[id]/_components/LineEditor.tsx`

La fila de descuento actualmente tiene `draggable={!isLocked}`. Cambiar a:

```tsx
draggable={row.display_type !== 'discount' && !isLocked}
```

Esto evita que el usuario arrastre el descuento fuera de su posición al fondo y que se escriban valores de `sequence` inconsistentes en la BD.

---

### 5. PDF — Sección de totales

**Archivo:** `components/pdf/QuotePDF.tsx`

**Interface:** Agregar `discount_approval_status?: string | null` al `interface Line` del PDF. Verificar que el caller del PDF pase este campo.

**Comportamiento:**
- La línea de descuento **permanece** en la tabla de líneas del PDF (comportamiento existente — el usuario confirmó que debe seguir ahí).
- Agregar adicionalmente una fila "Descuento Global" en el bloque de totales (antes del IVA y Total):
  - Solo si existe una línea `display_type === 'discount'` con `COALESCE(discount_approval_status, 'approved') !== 'pending'`.
  - Muestra porcentaje y monto en negativo.
  - **Importante:** `amount_untaxed`, `amount_tax` y `amount_total` ya reflejan el descuento. Esta fila es informativa.

---

### 6. Duplicación de cotizaciones

**Archivo:** `lib/queries/quotes.ts` → función `duplicateQuote`

La función copia todas las líneas incluyendo el `discount_approval_status` original. Una cotización duplicada con descuento aprobado tendrá su descuento ya aprobado desde el inicio. Esto es aceptable — la unicidad del descuento se mantiene (solo hay una línea copiada). No se requiere cambio.

---

## Flujo de usuario

1. Usuario agrega descuento global → crea línea `display_type = 'discount'` (flujo existente).
2. Si intenta agregar un segundo descuento → API retorna 400, UI muestra error.
3. La línea aparece al fondo de la tabla de líneas (no draggable).
4. Una vez aprobada → aparece también en el footer de totales del cotizador y en el bloque de totales del PDF.
5. Si se rechaza → la línea se elimina físicamente; el usuario puede solicitar uno nuevo.

## Flujo de aprobación

Sin cambios. Mismo flujo existente: admin/manager aprueba o rechaza en el panel de aprobaciones.

## Lo que NO cambia

- Estructura de la BD (sin migración).
- Flujo de aprobación de descuentos.
- Cálculo de totales (`updateQuoteTotals` ya lo maneja correctamente).
- Comportamiento de líneas de tipo producto, sección, nota.
- La línea de descuento sigue apareciendo en la tabla de líneas del PDF.
