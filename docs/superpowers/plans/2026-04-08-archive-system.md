# Archive System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an archiving system that lets users hide projects and quotes from default views without deleting them, with a toggle to show archived records.

**Architecture:** Add an `archived_at TIMESTAMPTZ NULL` column to both `projects` and `quotes` tables. Archived records are excluded from list queries by default. Each table component gets a "Mostrar archivados" toggle and per-row archive/unarchive actions via new dedicated API routes.

**Tech Stack:** PostgreSQL (ALTER TABLE migration), Next.js App Router API routes, React client components with `useState`/`useMemo`.

---

## File Map

| Action | File |
|--------|------|
| Create | `db/migrations/001_add_archived_at.sql` |
| Modify | `db/init/schema.sql` |
| Modify | `lib/queries/projects.ts` |
| Modify | `lib/queries/quotes.ts` |
| Create | `app/api/projects/[id]/archive/route.ts` |
| Create | `app/api/quotes/[id]/archive/route.ts` |
| Modify | `app/(app)/projects/_components/ProjectsTable.tsx` |
| Modify | `app/(app)/quotes/_components/QuotesTable.tsx` |

---

## Task 1: Database Migration

**Files:**
- Create: `db/migrations/001_add_archived_at.sql`
- Modify: `db/init/schema.sql`

- [ ] **Step 1: Create the migration SQL file**

```sql
-- db/migrations/001_add_archived_at.sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;
```

- [ ] **Step 2: Apply migration to the running database**

```bash
docker exec -i cotizador-db psql -U postgres -d cotizador < db/migrations/001_add_archived_at.sql
```

Expected output:
```
ALTER TABLE
ALTER TABLE
```

If using a different DB connection, run the SQL directly via your preferred client.

- [ ] **Step 3: Update schema.sql to include the new columns**

In `db/init/schema.sql`, add `archived_at TIMESTAMPTZ NULL` to the `projects` table definition (after `created_at`) and the `quotes` table definition (after the last existing column before the closing `)`).

- [ ] **Step 4: Commit**

```bash
git add db/migrations/001_add_archived_at.sql db/init/schema.sql
git commit -m "feat(archive): add archived_at column to projects and quotes"
```

---

## Task 2: Update TypeScript Queries — Projects

**Files:**
- Modify: `lib/queries/projects.ts`

- [ ] **Step 1: Add `archived_at` to the `Project` interface**

In `lib/queries/projects.ts`, add this field to the `Project` interface (after `created_at`):

```typescript
archived_at: string | null;
```

- [ ] **Step 2: Add `archiveProject` and `unarchiveProject` functions**

Append at the end of `lib/queries/projects.ts`:

```typescript
export async function archiveProject(id: string): Promise<void> {
  await pool.query('UPDATE projects SET archived_at = NOW() WHERE id = $1', [id])
}

export async function unarchiveProject(id: string): Promise<void> {
  await pool.query('UPDATE projects SET archived_at = NULL WHERE id = $1', [id])
}
```

- [ ] **Step 3: Verify the file compiles (no TypeScript errors)**

```bash
npx tsc --noEmit 2>&1 | grep projects
```

Expected: no output (no errors).

- [ ] **Step 4: Commit**

```bash
git add lib/queries/projects.ts
git commit -m "feat(archive): add archive/unarchive queries for projects"
```

---

## Task 3: Update TypeScript Queries — Quotes

**Files:**
- Modify: `lib/queries/quotes.ts`

- [ ] **Step 1: Add `archived_at` to the `Quote` interface**

In `lib/queries/quotes.ts`, add to the `Quote` interface (after `installation_notes`):

```typescript
archived_at: string | null;
```

- [ ] **Step 2: Add `archiveQuote` and `unarchiveQuote` functions**

Append at the end of `lib/queries/quotes.ts`:

```typescript
export async function archiveQuote(id: string): Promise<void> {
  await pool.query('UPDATE quotes SET archived_at = NOW() WHERE id = $1', [id])
}

export async function unarchiveQuote(id: string): Promise<void> {
  await pool.query('UPDATE quotes SET archived_at = NULL WHERE id = $1', [id])
}
```

- [ ] **Step 3: Verify no TypeScript errors**

```bash
npx tsc --noEmit 2>&1 | grep quotes
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add lib/queries/quotes.ts
git commit -m "feat(archive): add archive/unarchive queries for quotes"
```

---

## Task 4: Archive API Route — Projects

**Files:**
- Create: `app/api/projects/[id]/archive/route.ts`

The route accepts `POST` with body `{ archive: boolean }`. Admins and managers can archive any project; sales can only archive their own.

- [ ] **Step 1: Create the route file**

```typescript
// app/api/projects/[id]/archive/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { getProject, archiveProject, unarchiveProject } from '@/lib/queries/projects'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const { archive } = await req.json() as { archive: boolean }

  const project = await getProject(id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (session.role === 'sales' && project.user_id !== session.userId) return forbidden()

  if (archive) {
    await archiveProject(id)
  } else {
    await unarchiveProject(id)
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npx tsc --noEmit 2>&1 | grep -i archive
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add app/api/projects/[id]/archive/route.ts
git commit -m "feat(archive): add archive API route for projects"
```

---

## Task 5: Archive API Route — Quotes

**Files:**
- Create: `app/api/quotes/[id]/archive/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
// app/api/quotes/[id]/archive/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { getQuote, archiveQuote, unarchiveQuote } from '@/lib/queries/quotes'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const { archive } = await req.json() as { archive: boolean }

  const quote = await getQuote(id)
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (session.role === 'sales' && quote.user_id !== session.userId) return forbidden()

  if (archive) {
    await archiveQuote(id)
  } else {
    await unarchiveQuote(id)
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npx tsc --noEmit 2>&1 | grep -i archive
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add app/api/quotes/[id]/archive/route.ts
git commit -m "feat(archive): add archive API route for quotes"
```

---

## Task 6: UI — ProjectsTable Archive Toggle and Row Actions

**Files:**
- Modify: `app/(app)/projects/_components/ProjectsTable.tsx`

This task adds:
1. `archived_at` field to the local `Project` interface
2. A `showArchived` boolean state (default `false`)
3. A toggle button that shows count of archived projects
4. Client-side filtering to hide/show archived rows
5. Per-row archive/unarchive button (inline, no confirm needed)
6. Muted visual style + "Archivado" badge for archived rows

- [ ] **Step 1: Add `archived_at` to the local `Project` interface**

In `ProjectsTable.tsx`, change the `Project` interface to:

```typescript
interface Project {
  id: string
  name: string
  customer_name?: string
  executive_name?: string
  date: string | Date
  status: string
  quote_count?: number
  archived_at: string | null
}
```

- [ ] **Step 2: Add `showArchived` state and archive handler**

After the existing `useState` declarations (after `const [dateFilter, setDateFilter] = useState('')`), add:

```typescript
const [showArchived, setShowArchived] = useState(false)
const [archivingId, setArchivingId] = useState<string | null>(null)

const archivedCount = useMemo(() => projects.filter(p => p.archived_at !== null).length, [projects])

async function handleArchive(id: string, archive: boolean) {
  setArchivingId(id)
  const res = await fetch(`/api/projects/${id}/archive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ archive }),
  })
  setArchivingId(null)
  if (res.ok) router.refresh()
}
```

- [ ] **Step 3: Update `filteredProjects` to respect `showArchived`**

In the existing `filteredProjects` filter (the `.filter(p => {...})` block), add this condition at the start of the returned expression:

```typescript
const filteredProjects = projects.filter(p => {
  const isArchived = p.archived_at !== null
  if (!showArchived && isArchived) return false        // ← add this line
  // ... rest of existing conditions unchanged
```

- [ ] **Step 4: Add the "Mostrar archivados" toggle button**

In the filters row (the `<div className="flex flex-wrap items-center justify-center gap-2">` block), add this button **before** the existing filter chips:

```tsx
{archivedCount > 0 && (
  <button
    onClick={() => setShowArchived(v => !v)}
    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
    style={{
      background: showArchived ? 'var(--c-navy)' : 'var(--c-panel)',
      color: showArchived ? '#fff' : 'var(--c-ghost)',
      border: '1px solid var(--c-rim)',
    }}
  >
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
    </svg>
    {showArchived ? 'Ocultar archivados' : `Archivados (${archivedCount})`}
  </button>
)}
```

- [ ] **Step 5: Add archive badge and action button to each table row**

In the table row that renders each project (`<tr key={...}>`), find the last `<td>` cell that contains the delete button and add the archive button before it:

```tsx
{/* Archive / Unarchive button */}
<button
  onClick={() => handleArchive(p.id, p.archived_at === null)}
  disabled={archivingId === p.id}
  title={p.archived_at ? 'Desarchivar' : 'Archivar'}
  className="p-1.5 rounded-lg transition-colors"
  style={{ color: 'var(--c-ghost)' }}
  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--c-rim)' }}
  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
>
  {p.archived_at ? (
    // Unarchive icon (box with upward arrow)
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><polyline points="10 14 12 12 14 14"/><line x1="12" y1="12" x2="12" y2="17"/>
    </svg>
  ) : (
    // Archive icon (box)
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
    </svg>
  )}
</button>
```

Also add a visual "Archivado" badge next to the project name when `p.archived_at !== null`:

```tsx
{p.archived_at && (
  <span className="badge" style={{ background: 'var(--c-panel)', color: 'var(--c-ghost)', border: '1px solid var(--c-rim)', fontSize: '10px' }}>
    Archivado
  </span>
)}
```

And apply muted row styling: add `opacity: p.archived_at ? 0.5 : 1` to the `<tr>` element's style.

- [ ] **Step 6: Verify no TypeScript errors**

```bash
npx tsc --noEmit 2>&1 | grep ProjectsTable
```

Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add app/(app)/projects/_components/ProjectsTable.tsx
git commit -m "feat(archive): add archive toggle and row actions to ProjectsTable"
```

---

## Task 7: UI — QuotesTable Archive Toggle and Row Actions

**Files:**
- Modify: `app/(app)/quotes/_components/QuotesTable.tsx`

Same pattern as Task 6 but for quotes.

- [ ] **Step 1: Add `archived_at` to the local `Quote` interface**

```typescript
interface Quote {
  id: string
  number: string
  state: string
  customer_name?: string
  executive_name?: string
  quotation_date: string | Date
  amount_total: string
  description: string | null
  payment_term_name?: string
  archived_at: string | null   // ← add this
}
```

- [ ] **Step 2: Add `showArchived` state and archive handler**

After the existing `useState` declarations, add:

```typescript
const [showArchived, setShowArchived] = useState(false)
const [archivingId, setArchivingId] = useState<string | null>(null)

const archivedCount = useMemo(() => quotes.filter(q => q.archived_at !== null).length, [quotes])

async function handleArchive(id: string, archive: boolean) {
  setArchivingId(id)
  const res = await fetch(`/api/quotes/${id}/archive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ archive }),
  })
  setArchivingId(null)
  if (res.ok) router.refresh()
}
```

- [ ] **Step 3: Update the filtered quotes logic to respect `showArchived`**

In the existing filtered quotes `useMemo` or filter block, add as the first condition:

```typescript
const isArchived = q.archived_at !== null
if (!showArchived && isArchived) return false
```

- [ ] **Step 4: Add the "Mostrar archivados" toggle button**

In the filters row, add the same toggle button as in Task 6 Step 4 (replace "proyectos" with "cotizaciones" in any labels if desired).

- [ ] **Step 5: Add archive badge and action button to each table row**

Same pattern as Task 6 Step 5:
- Archive/unarchive button in the row actions cell (before the delete button)
- "Archivado" badge next to the quote number
- `opacity: 0.5` on `<tr>` style when `q.archived_at !== null`

- [ ] **Step 6: Verify no TypeScript errors**

```bash
npx tsc --noEmit 2>&1 | grep QuotesTable
```

Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add app/(app)/quotes/_components/QuotesTable.tsx
git commit -m "feat(archive): add archive toggle and row actions to QuotesTable"
```

---

## Task 8: Final Verification

- [ ] **Step 1: Full TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: Start dev server and smoke test**

```bash
npm run dev
```

Manual checks:
1. Visit `/projects` — no archived badge visible, archived projects hidden
2. Archive a project via the row button → row disappears
3. Toggle "Archivados (1)" → archived row reappears, muted, with "Archivado" badge
4. Click unarchive → row goes back to normal
5. Repeat steps 2–4 for `/quotes`
6. As a `sales` user: can archive own records; visiting archive endpoint for another user's record returns 403

- [ ] **Step 3: Final commit (if any cleanup needed)**

```bash
git add -p
git commit -m "feat(archive): complete archiving system for projects and quotes"
```

---

## Summary

| Task | What it does |
|------|-------------|
| 1 | DB migration: `archived_at` column on both tables |
| 2 | Query functions: archive/unarchive projects |
| 3 | Query functions: archive/unarchive quotes |
| 4 | API route: `POST /api/projects/[id]/archive` |
| 5 | API route: `POST /api/quotes/[id]/archive` |
| 6 | UI: ProjectsTable toggle + row archive actions |
| 7 | UI: QuotesTable toggle + row archive actions |
| 8 | Final verification |
