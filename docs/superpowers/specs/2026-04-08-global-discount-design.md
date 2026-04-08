# Descuento Global — Diseño

**Fecha:** 2026-04-08  
**Estado:** Aprobado  

## Contexto

El sistema de cotizaciones ya soporta líneas de tipo `display_type = 'discount'` que funcionan como descuento global sobre el subtotal de productos. Estas líneas pasan por el flujo de aprobación existente (requieren aprobación de admin o manager). El problema actual es que no hay límite de cuántas líneas de descuento global puede tener una cotización, y no aparecen de forma destacada en la sección de totales del cotizador ni del PDF.

## Objetivo

- Limitar a **un solo descuento global** por cotización.
- Mostrar el descuento siempre **al fondo** de la tabla de líneas.
- Mostrarlo explícitamente en la **sección de totales** del cotizador y del PDF.

## Opción elegida: A — Lógica de app (API + UI)

Sin migración de BD. Todo se maneja en API y capa de presentación.

---

## Diseño por componente

### 1. API — Enforcement de unicidad

**Archivo:** `app/api/quotes/[id]/lines/route.ts` (POST)

Antes de insertar una línea con `display_type = 'discount'`, consultar si ya existe una línea activa con ese `display_type` para la misma `quote_id`. Si existe, retornar:

```
HTTP 400 Bad Request
{ "error": "Ya existe un descuento global en esta cotización" }
```

No se modifica ninguna otra ruta.

---

### 2. Query — Ordenamiento

**Archivo:** `lib/queries/quotes.ts`

En la query que obtiene las líneas de la cotización, agregar ordenamiento explícito:

```sql
ORDER BY
  CASE WHEN display_type = 'discount' THEN 1 ELSE 0 END ASC,
  sequence ASC
```

Esto garantiza que la línea de descuento siempre aparezca al fondo, sin importar su `sequence`.

---

### 3. UI — Sección de totales del cotizador

**Archivo:** `app/(app)/quotes/[id]/page.tsx`

En el bloque de totales, agregar una fila "Descuento Global" que:
- Solo se renderiza si existe una línea `display_type = 'discount'` con `discount_approval_status = 'approved'` (o sin flujo de aprobación pendiente).
- Muestra el porcentaje (`discount_percent`) y el monto en negativo (`subtotal` de la línea).
- Se ubica visualmente entre el subtotal de productos y el IVA.

Si el descuento está pendiente, no aparece en totales (ya se muestra en la tabla de líneas con el indicador de estado actual).

---

### 4. PDF — Sección de totales

**Archivo:** `components/pdf/QuotePDF.tsx`

En el bloque de totales del PDF, agregar una fila "Descuento Global" entre el subtotal y el IVA:
- Solo si existe una línea `display_type = 'discount'` aprobada.
- Muestra porcentaje y monto en negativo.
- El Subtotal, IVA y Total ya reflejan el descuento (calculado por `updateQuoteTotals`), por lo que esta fila es puramente informativa/visual.

---

## Flujo de usuario

1. Usuario agrega descuento global → crea línea `display_type = 'discount'` (flujo existente).
2. Si intenta agregar un segundo descuento → API retorna 400, UI muestra error.
3. La línea aparece al fondo de la tabla de líneas (pendiente o aprobada).
4. Una vez aprobada → aparece también en la sección de totales del cotizador y del PDF.

## Flujo de aprobación

Sin cambios. Mismo flujo existente: admin/manager aprueba o rechaza en el panel de aprobaciones.

## Lo que NO cambia

- Estructura de la BD (sin migración).
- Flujo de aprobación de descuentos.
- Cálculo de totales (`updateQuoteTotals` ya lo maneja correctamente).
- Comportamiento de líneas de tipo producto, sección, nota.
