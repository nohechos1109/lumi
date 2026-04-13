# Individual Discount Approval Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Require admin approval when the `sales` role sets a non-zero `discount_percent` on a product line, mirroring the existing approval flow for global discount lines.

**Architecture:** The existing `discount_approvals` table and `discount_approval_status` column on `quote_lines` are reused. When a sales user PATCHes a product line with `discount_percent > 0`, the backend intercepts, stores the request without applying the discount, and notifies admins. On admin decision the approval handler branches on `display_type` to either apply the discount (approved) or clear the pending flag (rejected) without deleting the product line.

**Tech Stack:** Next.js App Router API routes, PostgreSQL (raw pool queries), React client components, TypeScript.

---

## File Map

| Action | File |
|--------|------|
| Modify | `lib/queries/quote_lines.ts` — add `pending_discount_percent` join to `listLines()`, extend `QuoteLine` interface |
| Modify | `lib/queries/discount-approvals.ts` — expose `quote_line_display_type` in `getDiscountApproval()` and `listPendingApprovals()` |
| Modify | `app/api/quotes/[id]/lines/[lineId]/route.ts` — intercept PATCH for sales+discount, trigger approval flow |
| Modify | `app/api/discount-approvals/[id]/route.ts` — branch on `display_type` for product-line decisions |
| Modify | `app/(app)/quotes/[id]/_components/LineEditor.tsx` — show pending badge + disable input on product lines |
| Modify | `app/(app)/admin/discount-approvals/_components/DiscountApprovalsClient.tsx` — add "Tipo" column |

---

## Background: How the Current System Works

- **Global discount** (`display_type = 'discount'`): a separate line created via `POST /api/quotes/[id]/lines`. When `session.role === 'sales'`, the line is created with `discount_approval_status = 'pending'`, a `discount_approvals` record is created, and admins are notified. `updateQuoteTotals()` skips pending global discount lines when computing totals.
- **Individual discount** (`discount_percent` field on a `display_type = 'product'` line): currently set via `PATCH /api/quotes/[id]/lines/[lineId]` with no approval check. The `updateLine()` function immediately applies the discount to `subtotal`.
- The `discount_approval_status` column already exists on `quote_lines` for both types.
- The `discount_approvals` table already stores `quote_line_id` and `discount_percent` (the requested value).

---

## Task 1: Expose pending discount in `listLines()`

**Files:**
- Modify: `lib/queries/quote_lines.ts`

The UI needs to show the *requested* (pending) discount value on a product line. Since we do **not** apply the pending discount to `discount_percent`, we fetch it via LEFT JOIN with `discount_approvals`.

- [ ] **Step 1: Add `pending_discount_percent` to `QuoteLine` interface**

In `lib/queries/quote_lines.ts`, add the field after `discount_approval_status`:

```typescript
export interface QuoteLine {
  id: string
  quote_id: string
  sequence: number
  display_type: 'product' | 'section' | 'note' | 'discount' | null
  product_id: string | null
  name: string
  qty: string | null
  discount_percent: string
  currency_snapshot: string | null
  cost_base_snapshot: string
  utility_fixed_snapshot: string
  utility_factor_snapshot: string
  fx_snapshot: string
  unit_price_mxn_suggested: string
  unit_price_mxn_manual: string | null
  unit_price_mxn_effective: string
  subtotal: string
  tax_amount: string
  total: string
  margin_amount: string
  discount_approval_status?: string | null
  pending_discount_percent?: string | null   // <-- new
  sku?: string
}
```

- [ ] **Step 2: Update `listLines()` query to join pending approvals**

Replace the existing `listLines` query body:

```typescript
export async function listLines(quoteId: string): Promise<QuoteLine[]> {
  const { rows } = await pool.query(
    `SELECT ql.*, p.sku as sku,
            da.discount_percent as pending_discount_percent
     FROM quote_lines ql
     LEFT JOIN products p ON p.id = ql.product_id
     LEFT JOIN discount_approvals da
            ON da.quote_line_id = ql.id AND da.status = 'pending'
     WHERE ql.quote_id = $1
     ORDER BY ql.sequence`,
    [quoteId]
  )
  return rows
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd "C:/Users/MARKETING & DISEÑO/Documents/cotizador-app"
npx tsc --noEmit 2>&1 | head -30
```

Expected: zero errors related to `pending_discount_percent`.

- [ ] **Step 4: Commit**

```bash
git add lib/queries/quote_lines.ts
git commit -m "feat(discounts): expose pending_discount_percent in listLines join"
```

---

## Task 2: Add `quote_line_display_type` to discount-approvals queries

**Files:**
- Modify: `lib/queries/discount-approvals.ts`

The approval handler needs to know whether the line being decided on is a global discount or a product line, so it can branch logic. The admin UI also needs this to display a "Tipo" column.

- [ ] **Step 1: Add `quote_line_display_type` to `DiscountApproval` interface**

```typescript
export interface DiscountApproval {
  id: string
  quote_id: string
  quote_line_id: string
  requested_by: string
  discount_percent: string
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  // Joined fields
  quote_number?: string
  requester_username?: string
  quote_line_name?: string
  quote_line_display_type?: string | null   // <-- new
}
```

- [ ] **Step 2: Update `listPendingApprovals()` to include `display_type`**

```typescript
export async function listPendingApprovals(): Promise<DiscountApproval[]> {
  const { rows } = await pool.query(
    `SELECT da.*, q.number as quote_number, u.username as requester_username,
            ql.name as quote_line_name, ql.display_type as quote_line_display_type
     FROM discount_approvals da
     JOIN quotes q ON q.id = da.quote_id
     JOIN users u ON u.id = da.requested_by
     JOIN quote_lines ql ON ql.id = da.quote_line_id
     WHERE da.status = 'pending'
     ORDER BY da.created_at DESC`
  )
  return rows
}
```

- [ ] **Step 3: Update `getDiscountApproval()` to include `display_type`**

```typescript
export async function getDiscountApproval(id: string): Promise<DiscountApproval | null> {
  const { rows } = await pool.query(
    `SELECT da.*, q.number as quote_number, u.username as requester_username,
            ql.name as quote_line_name, ql.display_type as quote_line_display_type
     FROM discount_approvals da
     JOIN quotes q ON q.id = da.quote_id
     JOIN users u ON u.id = da.requested_by
     JOIN quote_lines ql ON ql.id = da.quote_line_id
     WHERE da.id = $1`,
    [id]
  )
  return rows[0] ?? null
}
```

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
git add lib/queries/discount-approvals.ts
git commit -m "feat(discounts): expose quote_line_display_type in discount-approvals queries"
```

---

## Task 3: Intercept PATCH for individual discounts (sales role)

**Files:**
- Modify: `app/api/quotes/[id]/lines/[lineId]/route.ts`

When a sales user sets `discount_percent > 0` on a product line, we:
1. Strip `discount_percent` from the body so `updateLine()` doesn't apply it.
2. Check for an existing pending approval on this line (return 409 if found).
3. Set `discount_approval_status = 'pending'` on the line.
4. Create a `discount_approvals` record.
5. Notify all admins.
6. Still call `updateQuoteTotals()` (unchanged since `discount_percent` was not updated).

- [ ] **Step 1: Update imports**

Add the missing imports to `app/api/quotes/[id]/lines/[lineId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { updateLine, deleteLine } from '@/lib/queries/quote_lines'
import { updateQuoteTotals } from '@/lib/queries/quotes'
import pool from '@/lib/db'
import { createDiscountApproval } from '@/lib/queries/discount-approvals'
import { createNotification } from '@/lib/queries/notifications'
```

> Note: `createNotification` lives in `lib/queries/notifications.ts` and is already used by `app/api/quotes/[id]/lines/route.ts` — confirmed to exist.

- [ ] **Step 2: Replace the PATCH handler**

Full replacement of the PATCH function:

```typescript
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; lineId: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id, lineId } = await params
  const body = await req.json()

  // Existing guard: sales cannot manually set unit price
  if (session.role === 'sales' && body.unit_price_mxn_manual !== undefined) return forbidden()

  // Individual discount approval flow: sales + discount_percent > 0 on a product line
  if (session.role === 'sales' && body.discount_percent !== undefined && Number(body.discount_percent) > 0) {
    // Check the line exists and belongs to this quote
    const { rows: [line] } = await pool.query(
      `SELECT display_type, discount_approval_status FROM quote_lines WHERE id = $1 AND quote_id = $2`,
      [lineId, id]
    )
    if (!line) return NextResponse.json({ error: 'Línea no encontrada' }, { status: 404 })

    // Only product lines use this flow; global discount lines go through POST
    if (line.display_type === 'product') {
      // Block concurrent pending approval
      if (line.discount_approval_status === 'pending') {
        return NextResponse.json({ error: 'Ya existe una solicitud de descuento pendiente para esta línea' }, { status: 409 })
      }

      const requestedDiscount = Number(body.discount_percent)

      // Apply all other field changes (qty, name…) but NOT discount_percent.
      // updateLine() uses `data.discount_percent ?? current.discount_percent`, so stripping it
      // here preserves the existing approved discount_percent on the line.
      const { discount_percent: _ignored, ...restBody } = body
      if (Object.keys(restBody).length > 0) {
        await updateLine(lineId, restBody)
      }

      // Mark line as pending
      await pool.query(
        `UPDATE quote_lines SET discount_approval_status = 'pending' WHERE id = $1`,
        [lineId]
      )

      // Get the line name for notification
      const { rows: [lineInfo] } = await pool.query(
        `SELECT name FROM quote_lines WHERE id = $1`,
        [lineId]
      )

      // Create approval record
      const discountApproval = await createDiscountApproval({
        quote_id: id,
        quote_line_id: lineId,
        requested_by: session.userId,
        discount_percent: requestedDiscount,
      })

      // Notify all admins
      const { rows: admins } = await pool.query(`SELECT id FROM users WHERE role = 'admin'`)
      await Promise.all(admins.map((admin: { id: string }) =>
        createNotification({
          user_id: admin.id,
          type: 'discount_request',
          title: 'Nueva solicitud de descuento',
          message: `Vendedor solicitó un descuento del ${requestedDiscount}% en "${lineInfo?.name ?? 'producto'}".`,
          entity: 'discount_approval',
          entity_id: discountApproval.id,
        })
      ))

      // updateQuoteTotals is still called but since discount_percent on the line was NOT changed,
      // the product line's subtotal is unchanged and totals remain correct (pending discount excluded).
      await updateQuoteTotals(id)
      return NextResponse.json({ ok: true })
    }
  }

  // Default flow for non-sales or zero discount
  await updateLine(lineId, body)
  await updateQuoteTotals(id)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/quotes/[id]/lines/[lineId]/route.ts
git commit -m "feat(discounts): require approval for individual product-line discounts (sales role)"
```

---

## Task 4: Update approval handler to branch on `display_type`

**Files:**
- Modify: `app/api/discount-approvals/[id]/route.ts`

The handler currently:
- **Approved** → sets `discount_approval_status = 'approved'` on the line
- **Rejected** → deletes the line

For **product lines** the logic must differ:
- **Approved** → apply the pending `discount_percent` to the line (recalculate `subtotal` and `margin_amount` inline), set `discount_approval_status = 'approved'`. `updateQuoteTotals()` runs after the commit and its **step 0** recalculates `tax_amount` and `total` for all product lines from their updated `subtotal`, so no stale data.
- **Rejected** → clear `discount_approval_status` (set to `NULL`), do NOT delete the line

- [ ] **Step 1: Replace the transaction body inside the PATCH handler**

The full file becomes:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { getDiscountApproval } from '@/lib/queries/discount-approvals'
import pool from '@/lib/db'
import { updateQuoteTotals } from '@/lib/queries/quotes'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()

  const { id } = await params
  const body = await req.json()
  const decision: 'approved' | 'rejected' = body.decision

  if (decision !== 'approved' && decision !== 'rejected') {
    return NextResponse.json({ error: 'decision must be approved or rejected' }, { status: 400 })
  }

  const approval = await getDiscountApproval(id)
  if (!approval) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (approval.status !== 'pending') {
    return NextResponse.json({ error: 'Esta solicitud ya fue procesada' }, { status: 409 })
  }

  const isProductLine = approval.quote_line_display_type === 'product'

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Mark approval as reviewed
    await client.query(
      `UPDATE discount_approvals SET status = $1, reviewed_by = $2, reviewed_at = now() WHERE id = $3`,
      [decision, session.userId, id]
    )

    if (decision === 'approved') {
      if (isProductLine) {
        // Apply the pending discount_percent and recalculate subtotal
        await client.query(
          `UPDATE quote_lines
           SET discount_percent = $1,
               discount_approval_status = 'approved',
               subtotal = unit_price_mxn_effective * COALESCE(qty, 1) * (1 - $1::numeric / 100),
               margin_amount = unit_price_mxn_effective * COALESCE(qty, 1) * (1 - $1::numeric / 100)
                               - (cost_base_snapshot * fx_snapshot * COALESCE(qty, 0))
           WHERE id = $2`,
          [Number(approval.discount_percent), approval.quote_line_id]
        )
      } else {
        // Global discount line: just mark as approved (updateQuoteTotals recalibrates subtotal)
        await client.query(
          `UPDATE quote_lines SET discount_approval_status = 'approved' WHERE id = $1`,
          [approval.quote_line_id]
        )
      }
    } else {
      // Rejected
      if (isProductLine) {
        // Clear the pending flag — do NOT delete the product line
        await client.query(
          `UPDATE quote_lines SET discount_approval_status = NULL WHERE id = $1`,
          [approval.quote_line_id]
        )
      } else {
        // Global discount line: delete it
        await client.query(`DELETE FROM quote_lines WHERE id = $1`, [approval.quote_line_id])
      }
    }

    // 3. Notify requesting user
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, entity, entity_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        approval.requested_by,
        decision === 'approved' ? 'discount_approved' : 'discount_rejected',
        decision === 'approved' ? 'Descuento aprobado' : 'Descuento rechazado',
        `Tu descuento del ${approval.discount_percent}% ${isProductLine ? `en "${approval.quote_line_name}"` : 'en la cotización'} ha sido ${decision === 'approved' ? 'aprobado' : 'rechazado'}.`,
        'quote',
        approval.quote_id,
      ]
    )

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  await updateQuoteTotals(approval.quote_id)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add app/api/discount-approvals/[id]/route.ts
git commit -m "feat(discounts): branch approval handler on display_type for product-line discounts"
```

---

## Task 5: Update LineEditor UI for pending product-line discounts

**Files:**
- Modify: `app/(app)/quotes/[id]/_components/LineEditor.tsx`

Three changes:
1. Add `pending_discount_percent?: string | null` to the local `QuoteLine` interface.
2. On the product row, show a "Pendiente de aprobación (X%)" badge when `discount_approval_status === 'pending'`.
3. Disable the discount input on product rows when `discount_approval_status === 'pending'`.

- [ ] **Step 1: Update local `QuoteLine` interface**

At the top of the component (lines 11–18), add `pending_discount_percent`:

```typescript
interface QuoteLine {
  id: string; display_type: string; name: string; qty: string | null
  discount_percent: string; unit_price_mxn_effective: string
  unit_price_mxn_suggested: string; cost_base_snapshot: string
  subtotal: string; tax_amount: string; total: string
  margin_amount: string; tax_name?: string; sequence: number
  discount_approval_status?: string
  pending_discount_percent?: string | null   // <-- new
}
```

- [ ] **Step 2: Add pending badge to product rows**

Locate the product row render block (starts around line 426 with `return (`). In the name/description `<td>` (line ~432), add the pending badge after the line name:

```tsx
<td className="px-4 py-3" style={{ color: 'var(--c-ink)' }}>
  {line.name}
  {line.discount_approval_status === 'pending' && (
    <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-semibold"
      style={{ background: 'var(--c-amber-bg, rgba(251,191,36,0.12))', color: 'var(--c-amber)', border: '1px solid rgba(251,191,36,0.3)' }}>
      Desc. {Number(line.pending_discount_percent ?? 0).toFixed(0)}% — Pendiente
    </span>
  )}
</td>
```

- [ ] **Step 3: Disable discount input on product rows when pending**

Locate the product row discount `<td>` (around line 468–484). Disable the input when `discount_approval_status === 'pending'`:

```tsx
<td className="px-4 py-3 text-right">
  {isLocked || line.discount_approval_status === 'pending' ? (
    <span className="font-mono text-xs" style={{ color: 'var(--c-dim)' }}>
      {Number(line.discount_percent).toFixed(0)}%
    </span>
  ) : (
    <input type="number" min="0" max="100" step="1"
      defaultValue={Number(line.discount_percent).toFixed(0)}
      className={`w-16 ${inputCls}`} style={inputStyle}
      onFocus={e => (e.target.style.borderColor = 'var(--c-navy)')}
      onBlur={e => {
        e.target.style.borderColor = 'var(--c-rim)'
        const v = Number(e.target.value)
        if (v >= 0 && v <= 100) updateField(line.id, 'discount_percent', v)
      }}
      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
    />
  )}
</td>
```

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/quotes/[id]/_components/LineEditor.tsx"
git commit -m "feat(discounts): show pending badge and disable input on product lines awaiting approval"
```

---

## Task 6: Add "Tipo" column to admin approvals panel

**Files:**
- Modify: `app/(app)/admin/discount-approvals/_components/DiscountApprovalsClient.tsx`

Lets the admin immediately see if a request is for a global discount or an individual product line.

- [ ] **Step 1: Add `quote_line_display_type` to local `DiscountApproval` interface**

```typescript
interface DiscountApproval {
  id: string
  quote_id: string
  quote_number: string
  requester_username: string
  quote_line_name: string
  quote_line_display_type: string | null   // <-- new
  discount_percent: string
  created_at: string
}
```

- [ ] **Step 2: Add "Tipo" column header**

After the existing `<th>Línea</th>` (line ~87), add:

```tsx
<th className="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-widest w-24" style={{ color: 'var(--c-ghost)' }}>Tipo</th>
```

- [ ] **Step 3: Add "Tipo" data cell in each row**

After the `<td>` that renders `{a.quote_line_name}` (line ~110), add:

```tsx
<td className="px-4 py-3">
  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
    style={a.quote_line_display_type === 'product'
      ? { background: 'rgba(99,102,241,0.1)', color: 'rgb(99,102,241)', border: '1px solid rgba(99,102,241,0.3)' }
      : { background: 'var(--c-amber-bg, rgba(251,191,36,0.12))', color: 'var(--c-amber)', border: '1px solid rgba(251,191,36,0.3)' }
    }>
    {a.quote_line_display_type === 'product' ? 'Individual' : 'Global'}
  </span>
</td>
```

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/admin/discount-approvals/_components/DiscountApprovalsClient.tsx"
git commit -m "feat(discounts): add Tipo column to admin approvals panel (Global vs Individual)"
```

---

## Manual Test Checklist

After all tasks are committed, test end-to-end:

- [ ] Log in as `sales1`. Open a quote. Add a product.
- [ ] Set `discount_percent` to `10` on the product row — blur the field.
- [ ] Verify the field becomes read-only and the "Desc. 10% — Pendiente" badge appears.
- [ ] Verify the quote totals do NOT include the 10% discount.
- [ ] Log in as admin. Go to `/admin/discount-approvals`.
- [ ] Verify the request appears with tipo "Individual" and the product name in "Línea".
- [ ] Approve the request.
- [ ] Log back in as `sales1`. Verify the badge is gone, the field shows 10%, and totals now reflect the discount.
- [ ] Repeat, but this time reject the request. Verify the badge disappears, the field shows 0%, and totals are unchanged.
- [ ] Verify the global discount flow (adding a "Descuento Global" line as `sales1`) still works as before.
