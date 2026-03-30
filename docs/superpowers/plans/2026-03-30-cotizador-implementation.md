# Cotizador App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack quotation management app with 3 roles (sales/manager/admin), PostgreSQL, iron-session auth, and PDF generation.

**Architecture:** Next.js 16 App Router with API Route Handlers for all data operations, iron-session for encrypted cookie auth, and direct `pg` queries (no ORM). Each role has its own dashboard and route group.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, PostgreSQL (`pg`), `iron-session`, `bcryptjs`, `@react-pdf/renderer`

**Spec:** `docs/superpowers/specs/2026-03-30-cotizador-design.md`

---

## File Map

```
.env.local                                  ← DB + session secret (never commit)
middleware.ts                               ← route protection by role
lib/
  db.ts                                     ← pg Pool singleton
  session.ts                                ← iron-session config + types
  queries/
    users.ts                                ← findByUsername, findById
    quotes.ts                               ← list, get, create, update, updateState
    quote_lines.ts                          ← list, create, update, delete
    products.ts                             ← list, search
    customers.ts                            ← list, create, update, delete
    taxes.ts                                ← list
    settings.ts                             ← getSettings, updateFx
app/
  (auth)/
    login/page.tsx                          ← login form (Client Component)
  (app)/
    layout.tsx                              ← nav sidebar by role
    quotes/
      page.tsx                              ← sales: list own quotes
      new/page.tsx                          ← sales: create quote form
      [id]/
        page.tsx                            ← sales: quote editor
        _components/
          LineEditor.tsx                    ← add/edit/remove lines
          ProductSearch.tsx                 ← search + catalog picker
    manager/
      page.tsx                              ← all quotes + filters
      [id]/page.tsx                         ← quote detail + confirm/cancel
    admin/
      page.tsx                              ← admin dashboard links
      users/page.tsx                        ← users CRUD
      products/page.tsx                     ← products CRUD
      customers/page.tsx                    ← customers CRUD
      settings/page.tsx                     ← FX rate + taxes + payment terms
  api/
    auth/
      login/route.ts                        ← POST: verify credentials, set session
      logout/route.ts                       ← POST: destroy session
    quotes/
      route.ts                              ← GET list (sales), POST create
      [id]/route.ts                         ← GET, PATCH, DELETE
      [id]/state/route.ts                   ← PATCH: change state
      [id]/lines/route.ts                   ← GET, POST lines
      [id]/lines/[lineId]/route.ts          ← PATCH, DELETE line
    products/route.ts                       ← GET list + ?q= search
    customers/route.ts                      ← GET list
    taxes/route.ts                          ← GET list
    settings/route.ts                       ← GET, PATCH fx rate
    pdf/[id]/route.ts                       ← GET: generate + stream PDF
    admin/
      users/route.ts                        ← GET, POST
      users/[id]/route.ts                   ← PATCH, DELETE
      products/route.ts                     ← GET, POST
      products/[id]/route.ts                ← PATCH, DELETE
      customers/route.ts                    ← GET, POST
      customers/[id]/route.ts               ← PATCH, DELETE
      taxes/route.ts                        ← GET, POST
      taxes/[id]/route.ts                   ← PATCH, DELETE
      payment-terms/route.ts               ← GET, POST
      payment-terms/[id]/route.ts          ← PATCH, DELETE
components/
  pdf/QuotePDF.tsx                          ← React PDF template
```

---

## Task 1: Install Dependencies & Environment

**Files:**
- Create: `.env.local`
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install packages**

```bash
cd "C:\Users\MARKETING & DISEÑO\Documents\cotizador-app"
npm install iron-session bcryptjs @react-pdf/renderer
npm install --save-dev @types/bcryptjs
```

Expected: packages added to `node_modules/`, no errors.

- [ ] **Step 2: Create `.env.local`**

```bash
# .env.local
DB_HOST=192.168.0.111
DB_PORT=3305
DB_NAME=cotizador
DB_USER=admin
DB_PASSWORD=admin
SESSION_SECRET=change_this_to_a_random_32_char_secret_string_here
SESSION_COOKIE_NAME=cotizador_session
```

> SESSION_SECRET must be at least 32 characters. Replace placeholder with any random string.

- [ ] **Step 3: Add `.env.local` to `.gitignore`**

Open `.gitignore` (or create it) and ensure this line exists:
```
.env.local
```

- [ ] **Step 4: Verify dev server starts**

```bash
npm run dev
```

Expected: server starts at `http://localhost:3000` with no errors.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "feat: install iron-session, bcryptjs, react-pdf deps"
```

---

## Task 2: Database Migrations

**Files:** None (SQL run directly against DB)

Run these SQL statements in Adminer (`http://192.168.0.111:3305`) via "Comando SQL":

- [ ] **Step 1: Add credentials columns to users**

```sql
ALTER TABLE users
  ADD COLUMN username text UNIQUE NOT NULL DEFAULT '',
  ADD COLUMN password_hash text NOT NULL DEFAULT '';

-- Remove defaults after adding (they were needed for NOT NULL with existing rows)
ALTER TABLE users
  ALTER COLUMN username DROP DEFAULT,
  ALTER COLUMN password_hash DROP DEFAULT;
```

- [ ] **Step 2: Add user_id to quotes**

```sql
ALTER TABLE quotes
  ADD COLUMN user_id uuid REFERENCES users(id);
```

- [ ] **Step 3: Seed usernames and hashed passwords**

Use bcrypt hash for password `demo1234`. Hash value: `$2b$10$abcdefghijklmnopqrstuuVFAKEHASHreplaceWithRealOne`

> IMPORTANT: Generate a real hash first. Run this in a Node.js REPL:
> ```js
> const bcrypt = require('bcryptjs')
> console.log(await bcrypt.hash('demo1234', 10))
> ```
> Then replace `HASH_HERE` below with the output.

```sql
UPDATE users SET username = 'admin',   password_hash = 'HASH_HERE' WHERE role = 'admin';
UPDATE users SET username = 'manager', password_hash = 'HASH_HERE' WHERE role = 'manager';
UPDATE users SET username = 'sales1',  password_hash = 'HASH_HERE'
  WHERE id = (SELECT id FROM users WHERE role = 'sales' LIMIT 1);
UPDATE users SET username = 'sales2',  password_hash = 'HASH_HERE'
  WHERE id = (SELECT id FROM users WHERE role = 'sales' OFFSET 1 LIMIT 1);
```

- [ ] **Step 4: Verify in Adminer**

Run `SELECT id, username, role FROM users;` — should show 4 rows with usernames.

---

## Task 3: DB Connection & Query Layer

**Files:**
- Create: `lib/db.ts`
- Create: `lib/queries/users.ts`
- Create: `lib/queries/quotes.ts`
- Create: `lib/queries/quote_lines.ts`
- Create: `lib/queries/products.ts`
- Create: `lib/queries/customers.ts`
- Create: `lib/queries/taxes.ts`
- Create: `lib/queries/settings.ts`

- [ ] **Step 1: Create `lib/db.ts`**

```ts
import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

export default pool
```

- [ ] **Step 2: Create `lib/queries/users.ts`**

```ts
import pool from '@/lib/db'

export interface User {
  id: string
  role: 'sales' | 'manager' | 'admin'
  username: string
  password_hash: string
}

export async function findByUsername(username: string): Promise<User | null> {
  const { rows } = await pool.query(
    'SELECT id, role, username, password_hash FROM users WHERE username = $1',
    [username]
  )
  return rows[0] ?? null
}

export async function findById(id: string): Promise<Omit<User, 'password_hash'> | null> {
  const { rows } = await pool.query(
    'SELECT id, role, username FROM users WHERE id = $1',
    [id]
  )
  return rows[0] ?? null
}

export async function listUsers(): Promise<Omit<User, 'password_hash'>[]> {
  const { rows } = await pool.query(
    'SELECT id, role, username FROM users ORDER BY role, username'
  )
  return rows
}

export async function createUser(username: string, role: string, password_hash: string): Promise<User> {
  const { rows } = await pool.query(
    'INSERT INTO users (username, role, password_hash) VALUES ($1, $2, $3) RETURNING id, role, username, password_hash',
    [username, role, password_hash]
  )
  return rows[0]
}

export async function updateUser(id: string, data: { username?: string; role?: string; password_hash?: string }): Promise<void> {
  const fields: string[] = []
  const values: unknown[] = []
  let i = 1
  if (data.username)      { fields.push(`username = $${i++}`);      values.push(data.username) }
  if (data.role)          { fields.push(`role = $${i++}`);          values.push(data.role) }
  if (data.password_hash) { fields.push(`password_hash = $${i++}`); values.push(data.password_hash) }
  if (!fields.length) return
  values.push(id)
  await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${i}`, values)
}

export async function deleteUser(id: string): Promise<void> {
  await pool.query('DELETE FROM users WHERE id = $1', [id])
}
```

- [ ] **Step 3: Create `lib/queries/products.ts`**

```ts
import pool from '@/lib/db'

export interface Product {
  id: string
  sku: string | null
  name: string
  currency: 'MXN' | 'USD'
  cost_base: string
  utility_fixed: string
  utility_factor: string
}

export async function listProducts(): Promise<Product[]> {
  const { rows } = await pool.query(
    'SELECT id, sku, name, currency, cost_base, utility_fixed, utility_factor FROM products ORDER BY name'
  )
  return rows
}

export async function searchProducts(q: string): Promise<Product[]> {
  const { rows } = await pool.query(
    `SELECT id, sku, name, currency, cost_base, utility_fixed, utility_factor
     FROM products
     WHERE name ILIKE $1 OR sku ILIKE $1
     ORDER BY name LIMIT 20`,
    [`%${q}%`]
  )
  return rows
}

export async function createProduct(data: Omit<Product, 'id'>): Promise<Product> {
  const { rows } = await pool.query(
    `INSERT INTO products (sku, name, currency, cost_base, utility_fixed, utility_factor)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [data.sku, data.name, data.currency, data.cost_base, data.utility_fixed, data.utility_factor]
  )
  return rows[0]
}

export async function updateProduct(id: string, data: Partial<Omit<Product, 'id'>>): Promise<void> {
  const fields: string[] = []
  const values: unknown[] = []
  let i = 1
  const allowed = ['sku','name','currency','cost_base','utility_fixed','utility_factor'] as const
  for (const key of allowed) {
    if (data[key] !== undefined) { fields.push(`${key} = $${i++}`); values.push(data[key]) }
  }
  if (!fields.length) return
  values.push(id)
  await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = $${i}`, values)
}

export async function deleteProduct(id: string): Promise<void> {
  await pool.query('DELETE FROM products WHERE id = $1', [id])
}
```

- [ ] **Step 4: Create `lib/queries/customers.ts`**

```ts
import pool from '@/lib/db'

export interface Customer { id: string; name: string }

export async function listCustomers(): Promise<Customer[]> {
  const { rows } = await pool.query('SELECT id, name FROM customers ORDER BY name')
  return rows
}

export async function createCustomer(name: string): Promise<Customer> {
  const { rows } = await pool.query(
    'INSERT INTO customers (name) VALUES ($1) RETURNING id, name', [name]
  )
  return rows[0]
}

export async function updateCustomer(id: string, name: string): Promise<void> {
  await pool.query('UPDATE customers SET name = $1 WHERE id = $2', [name, id])
}

export async function deleteCustomer(id: string): Promise<void> {
  await pool.query('DELETE FROM customers WHERE id = $1', [id])
}
```

- [ ] **Step 5: Create `lib/queries/taxes.ts`**

```ts
import pool from '@/lib/db'

export interface Tax { id: string; name: string; rate: string }

export async function listTaxes(): Promise<Tax[]> {
  const { rows } = await pool.query('SELECT id, name, rate FROM taxes ORDER BY name')
  return rows
}

export async function createTax(name: string, rate: number): Promise<Tax> {
  const { rows } = await pool.query(
    'INSERT INTO taxes (name, rate) VALUES ($1, $2) RETURNING id, name, rate', [name, rate]
  )
  return rows[0]
}

export async function updateTax(id: string, data: { name?: string; rate?: number }): Promise<void> {
  const fields: string[] = []
  const values: unknown[] = []
  let i = 1
  if (data.name !== undefined) { fields.push(`name = $${i++}`); values.push(data.name) }
  if (data.rate !== undefined) { fields.push(`rate = $${i++}`); values.push(data.rate) }
  if (!fields.length) return
  values.push(id)
  await pool.query(`UPDATE taxes SET ${fields.join(', ')} WHERE id = $${i}`, values)
}

export async function deleteTax(id: string): Promise<void> {
  await pool.query('DELETE FROM taxes WHERE id = $1', [id])
}
```

- [ ] **Step 6: Create `lib/queries/settings.ts`**

```ts
import pool from '@/lib/db'

export interface GlobalSettings { id: string; fx_mxn_per_usd: string }
export interface PaymentTerm { id: string; name: string }

export async function getSettings(): Promise<GlobalSettings | null> {
  const { rows } = await pool.query('SELECT id, fx_mxn_per_usd FROM global_settings LIMIT 1')
  return rows[0] ?? null
}

export async function updateFx(fx: number): Promise<void> {
  await pool.query('UPDATE global_settings SET fx_mxn_per_usd = $1', [fx])
}

export async function listPaymentTerms(): Promise<PaymentTerm[]> {
  const { rows } = await pool.query('SELECT id, name FROM payment_terms ORDER BY name')
  return rows
}

export async function createPaymentTerm(name: string): Promise<PaymentTerm> {
  const { rows } = await pool.query(
    'INSERT INTO payment_terms (name) VALUES ($1) RETURNING id, name', [name]
  )
  return rows[0]
}

export async function deletePaymentTerm(id: string): Promise<void> {
  await pool.query('DELETE FROM payment_terms WHERE id = $1', [id])
}
```

- [ ] **Step 7: Create `lib/queries/quotes.ts`**

```ts
import pool from '@/lib/db'

export type QuoteState = 'draft' | 'sent' | 'confirmed' | 'cancelled' | 'expired'

export interface Quote {
  id: string
  number: string
  state: QuoteState
  customer_id: string
  customer_name?: string
  payment_term_id: string | null
  payment_term_name?: string
  quotation_date: string
  expiration_date: string | null
  fx_mxn_per_usd_snapshot: string
  terms: string | null
  amount_untaxed: string
  amount_tax: string
  amount_total: string
  margin_amount: string
  margin_percent: string
  version: number
  user_id: string | null
}

export async function listQuotesByUser(userId: string): Promise<Quote[]> {
  const { rows } = await pool.query(
    `SELECT q.*, c.name as customer_name, pt.name as payment_term_name
     FROM quotes q
     LEFT JOIN customers c ON c.id = q.customer_id
     LEFT JOIN payment_terms pt ON pt.id = q.payment_term_id
     WHERE q.user_id = $1
     ORDER BY q.quotation_date DESC`,
    [userId]
  )
  return rows
}

export async function listAllQuotes(): Promise<Quote[]> {
  const { rows } = await pool.query(
    `SELECT q.*, c.name as customer_name, pt.name as payment_term_name
     FROM quotes q
     LEFT JOIN customers c ON c.id = q.customer_id
     LEFT JOIN payment_terms pt ON pt.id = q.payment_term_id
     ORDER BY q.quotation_date DESC`
  )
  return rows
}

export async function getQuote(id: string): Promise<Quote | null> {
  const { rows } = await pool.query(
    `SELECT q.*, c.name as customer_name, pt.name as payment_term_name
     FROM quotes q
     LEFT JOIN customers c ON c.id = q.customer_id
     LEFT JOIN payment_terms pt ON pt.id = q.payment_term_id
     WHERE q.id = $1`,
    [id]
  )
  return rows[0] ?? null
}

export interface CreateQuoteInput {
  customer_id: string
  payment_term_id?: string
  quotation_date: string
  expiration_date?: string
  fx_mxn_per_usd_snapshot: number
  terms?: string
  user_id: string
}

export async function createQuote(data: CreateQuoteInput): Promise<Quote> {
  // Generate quote number: COT-YYYYMMDD-XXXX
  const date = new Date().toISOString().slice(0,10).replace(/-/g,'')
  const { rows: [{ count }] } = await pool.query('SELECT COUNT(*) FROM quotes')
  const number = `COT-${date}-${String(Number(count) + 1).padStart(4,'0')}`

  const { rows } = await pool.query(
    `INSERT INTO quotes
       (number, state, customer_id, payment_term_id, quotation_date, expiration_date,
        fx_mxn_per_usd_snapshot, terms, user_id)
     VALUES ($1,'draft',$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [number, data.customer_id, data.payment_term_id ?? null, data.quotation_date,
     data.expiration_date ?? null, data.fx_mxn_per_usd_snapshot, data.terms ?? null, data.user_id]
  )
  return rows[0]
}

export async function updateQuoteState(id: string, state: QuoteState): Promise<void> {
  await pool.query('UPDATE quotes SET state = $1 WHERE id = $2', [state, id])
}

export async function updateQuoteTotals(id: string): Promise<void> {
  // Recompute totals from lines
  await pool.query(`
    UPDATE quotes q SET
      amount_untaxed = COALESCE((SELECT SUM(subtotal) FROM quote_lines WHERE quote_id = q.id), 0),
      amount_tax     = COALESCE((SELECT SUM(tax_amount) FROM quote_lines WHERE quote_id = q.id), 0),
      amount_total   = COALESCE((SELECT SUM(total) FROM quote_lines WHERE quote_id = q.id), 0)
    WHERE q.id = $1
  `, [id])
}
```

- [ ] **Step 8: Create `lib/queries/quote_lines.ts`**

```ts
import pool from '@/lib/db'

export interface QuoteLine {
  id: string
  quote_id: string
  sequence: number
  display_type: 'product' | 'section' | 'note' | 'discount' | null
  product_id: string | null
  name: string
  qty: string | null
  discount_percent: string
  tax_id: string | null
  tax_name?: string
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
}

export async function listLines(quoteId: string): Promise<QuoteLine[]> {
  const { rows } = await pool.query(
    `SELECT ql.*, t.name as tax_name
     FROM quote_lines ql
     LEFT JOIN taxes t ON t.id = ql.tax_id
     WHERE ql.quote_id = $1
     ORDER BY ql.sequence`,
    [quoteId]
  )
  return rows
}

export interface CreateLineInput {
  quote_id: string
  display_type: 'product' | 'section' | 'note' | 'discount'
  product_id?: string
  name: string
  qty?: number
  discount_percent?: number
  tax_id?: string
  currency_snapshot?: string
  cost_base_snapshot?: number
  utility_fixed_snapshot?: number
  utility_factor_snapshot?: number
  fx_snapshot?: number
  unit_price_mxn_suggested?: number
  unit_price_mxn_manual?: number
}

export async function createLine(data: CreateLineInput): Promise<QuoteLine> {
  // Get next sequence
  const { rows: [{ max }] } = await pool.query(
    'SELECT COALESCE(MAX(sequence),0) as max FROM quote_lines WHERE quote_id = $1',
    [data.quote_id]
  )
  const sequence = Number(max) + 1

  const effective = data.unit_price_mxn_manual ?? data.unit_price_mxn_suggested ?? 0
  const qty = data.qty ?? 1
  const discount = data.discount_percent ?? 0
  const subtotal = Number(effective) * qty * (1 - discount / 100)

  const { rows } = await pool.query(
    `INSERT INTO quote_lines
       (quote_id, sequence, display_type, product_id, name, qty, discount_percent, tax_id,
        currency_snapshot, cost_base_snapshot, utility_fixed_snapshot, utility_factor_snapshot,
        fx_snapshot, unit_price_mxn_suggested, unit_price_mxn_manual, unit_price_mxn_effective,
        subtotal, tax_amount, total, margin_amount)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,0,$17,0)
     RETURNING *`,
    [data.quote_id, sequence, data.display_type, data.product_id ?? null, data.name,
     qty, discount, data.tax_id ?? null,
     data.currency_snapshot ?? null, data.cost_base_snapshot ?? 0,
     data.utility_fixed_snapshot ?? 0, data.utility_factor_snapshot ?? 1,
     data.fx_snapshot ?? 1, data.unit_price_mxn_suggested ?? 0,
     data.unit_price_mxn_manual ?? null, effective, subtotal]
  )
  return rows[0]
}

export async function updateLine(id: string, data: Partial<CreateLineInput> & { unit_price_mxn_manual?: number | null }): Promise<void> {
  const fields: string[] = []
  const values: unknown[] = []
  let i = 1
  const allowed = ['name','qty','discount_percent','tax_id','unit_price_mxn_manual'] as const
  for (const key of allowed) {
    if (data[key as keyof typeof data] !== undefined) {
      fields.push(`${key} = $${i++}`)
      values.push(data[key as keyof typeof data])
    }
  }
  if (!fields.length) return
  values.push(id)
  await pool.query(`UPDATE quote_lines SET ${fields.join(', ')} WHERE id = $${i}`, values)
}

export async function deleteLine(id: string): Promise<void> {
  await pool.query('DELETE FROM quote_lines WHERE id = $1', [id])
}
```

- [ ] **Step 9: Verify DB connection**

Start dev server and open `http://localhost:3000`. No errors in terminal = DB connects ok.

- [ ] **Step 10: Commit**

```bash
git add lib/
git commit -m "feat: add db connection pool and query layer"
```

---

## Task 4: Session Config + Auth API Routes

**Files:**
- Create: `lib/session.ts`
- Create: `app/api/auth/login/route.ts`
- Create: `app/api/auth/logout/route.ts`

- [ ] **Step 1: Create `lib/session.ts`**

```ts
import { IronSessionOptions } from 'iron-session'

export interface SessionData {
  userId: string
  role: 'sales' | 'manager' | 'admin'
  username: string
}

export const sessionOptions: IronSessionOptions = {
  cookieName: process.env.SESSION_COOKIE_NAME ?? 'cotizador_session',
  password: process.env.SESSION_SECRET as string,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
  },
}
```

- [ ] **Step 2: Create `app/api/auth/login/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { findByUsername } from '@/lib/queries/users'
import { sessionOptions, SessionData } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'Credenciales requeridas' }, { status: 400 })
  }

  const user = await findByUsername(username)
  if (!user) {
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 })
  }

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  session.userId = user.id
  session.role = user.role
  session.username = user.username
  await session.save()

  return NextResponse.json({ role: user.role })
}
```

- [ ] **Step 3: Create `app/api/auth/logout/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'

export async function POST() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  session.destroy()
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Test login endpoint**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"demo1234"}'
```

Expected: `{"role":"admin"}` and a `Set-Cookie` header.

- [ ] **Step 5: Commit**

```bash
git add lib/session.ts app/api/auth/
git commit -m "feat: add iron-session config and auth API routes"
```

---

## Task 5: Middleware + Login Page

**Files:**
- Create: `middleware.ts`
- Create: `app/(auth)/login/page.tsx`

- [ ] **Step 1: Create `middleware.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'

const PUBLIC_PATHS = ['/login', '/api/auth/login']

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  if (PUBLIC_PATHS.some(p => path.startsWith(p))) {
    return NextResponse.next()
  }

  // Skip API routes that are not auth — they check session themselves
  if (path.startsWith('/api/')) {
    return NextResponse.next()
  }

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  if (!session.userId) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Role-based route guards
  if (path.startsWith('/admin') && session.role !== 'admin') {
    return NextResponse.redirect(new URL('/quotes', req.url))
  }

  if (path.startsWith('/manager') && session.role === 'sales') {
    return NextResponse.redirect(new URL('/quotes', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 2: Create `app/(auth)/login/page.tsx`**

```tsx
'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const form = new FormData(e.currentTarget)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: form.get('username'),
        password: form.get('password'),
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Error al iniciar sesión')
      return
    }

    if (data.role === 'admin')   router.push('/admin')
    else if (data.role === 'manager') router.push('/manager')
    else router.push('/quotes')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Cotizador</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <input
              name="username"
              type="text"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              name="password"
              type="password"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify in browser**

Open `http://localhost:3000` — should redirect to `/login`. Login with `admin / demo1234` — should redirect to `/admin` (404 is fine, page doesn't exist yet).

- [ ] **Step 4: Commit**

```bash
git add middleware.ts app/\(auth\)/
git commit -m "feat: add middleware route protection and login page"
```

---

## Task 6: App Layout + Navigation

**Files:**
- Create: `app/(app)/layout.tsx`
- Modify: `app/page.tsx` (redirect to /login)

- [ ] **Step 1: Redirect root page**

Replace `app/page.tsx` content:

```tsx
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/login')
}
```

- [ ] **Step 2: Create `app/(app)/layout.tsx`**

```tsx
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import Link from 'next/link'
import LogoutButton from './_components/LogoutButton'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  const navItems = {
    sales: [
      { href: '/quotes', label: 'Mis Cotizaciones' },
    ],
    manager: [
      { href: '/manager', label: 'Cotizaciones' },
    ],
    admin: [
      { href: '/admin', label: 'Dashboard' },
      { href: '/admin/users', label: 'Usuarios' },
      { href: '/admin/products', label: 'Productos' },
      { href: '/admin/customers', label: 'Clientes' },
      { href: '/admin/settings', label: 'Configuración' },
    ],
  }

  const items = navItems[session.role] ?? []

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-4 py-5 border-b border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Cotizador</p>
          <p className="text-sm font-medium text-gray-800 mt-0.5">{session.username}</p>
          <p className="text-xs text-gray-400 capitalize">{session.role}</p>
        </div>
        <nav className="flex-1 px-2 py-4 flex flex-col gap-1">
          {items.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/(app)/_components/LogoutButton.tsx`**

```tsx
'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
    >
      Cerrar sesión
    </button>
  )
}
```

- [ ] **Step 4: Verify layout**

Login → should see sidebar with nav items matching the role.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/\(app\)/
git commit -m "feat: add app layout with role-based sidebar navigation"
```

---

## Task 7: Quotes API Routes (Sales)

**Files:**
- Create: `app/api/quotes/route.ts`
- Create: `app/api/quotes/[id]/route.ts`
- Create: `app/api/quotes/[id]/state/route.ts`
- Create: `app/api/quotes/[id]/lines/route.ts`
- Create: `app/api/quotes/[id]/lines/[lineId]/route.ts`

**Helper (create once, reuse in all API routes):**

- [ ] **Step 1: Create `lib/auth-guard.ts`**

```ts
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { NextResponse } from 'next/server'

export async function getSession(): Promise<SessionData | null> {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  return session.userId ? session : null
}

export function unauthorized() {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
}

export function forbidden() {
  return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
}
```

- [ ] **Step 2: Create `app/api/quotes/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { listQuotesByUser, listAllQuotes, createQuote } from '@/lib/queries/quotes'
import { getSettings } from '@/lib/queries/settings'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()

  const quotes = session.role === 'sales'
    ? await listQuotesByUser(session.userId)
    : await listAllQuotes()

  return NextResponse.json(quotes)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()

  const body = await req.json()
  const settings = await getSettings()

  const quote = await createQuote({
    customer_id: body.customer_id,
    payment_term_id: body.payment_term_id,
    quotation_date: body.quotation_date ?? new Date().toISOString(),
    expiration_date: body.expiration_date,
    fx_mxn_per_usd_snapshot: Number(settings?.fx_mxn_per_usd ?? 17.85),
    terms: body.terms,
    user_id: session.userId,
  })

  return NextResponse.json(quote, { status: 201 })
}
```

- [ ] **Step 3: Create `app/api/quotes/[id]/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { getQuote } from '@/lib/queries/quotes'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const quote = await getQuote(id)
  if (!quote) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  if (session.role === 'sales' && quote.user_id !== session.userId) return forbidden()

  return NextResponse.json(quote)
}
```

- [ ] **Step 4: Create `app/api/quotes/[id]/state/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { getQuote, updateQuoteState, QuoteState } from '@/lib/queries/quotes'

const VALID_TRANSITIONS: Record<string, QuoteState[]> = {
  sales:   ['sent', 'cancelled'],
  manager: ['confirmed', 'cancelled'],
  admin:   ['draft', 'sent', 'confirmed', 'cancelled', 'expired'],
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const { state } = await req.json()

  const quote = await getQuote(id)
  if (!quote) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  if (session.role === 'sales' && quote.user_id !== session.userId) return forbidden()

  const allowed = VALID_TRANSITIONS[session.role] ?? []
  if (!allowed.includes(state)) return forbidden()

  await updateQuoteState(id, state)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 5: Create `app/api/quotes/[id]/lines/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { getQuote, updateQuoteTotals } from '@/lib/queries/quotes'
import { listLines, createLine } from '@/lib/queries/quote_lines'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const quote = await getQuote(id)
  if (!quote) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (session.role === 'sales' && quote.user_id !== session.userId) return forbidden()

  const lines = await listLines(id)
  return NextResponse.json(lines)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const quote = await getQuote(id)
  if (!quote) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (session.role === 'sales' && quote.user_id !== session.userId) return forbidden()

  const body = await req.json()
  const line = await createLine({ ...body, quote_id: id })
  await updateQuoteTotals(id)
  return NextResponse.json(line, { status: 201 })
}
```

- [ ] **Step 6: Create `app/api/quotes/[id]/lines/[lineId]/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { updateLine, deleteLine } from '@/lib/queries/quote_lines'
import { updateQuoteTotals } from '@/lib/queries/quotes'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; lineId: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id, lineId } = await params
  const body = await req.json()
  await updateLine(lineId, body)
  await updateQuoteTotals(id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; lineId: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id, lineId } = await params
  await deleteLine(lineId)
  await updateQuoteTotals(id)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 7: Create supporting API routes (products, customers, taxes, settings)**

`app/api/products/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { listProducts, searchProducts } from '@/lib/queries/products'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()

  const q = req.nextUrl.searchParams.get('q')
  const products = q ? await searchProducts(q) : await listProducts()
  return NextResponse.json(products)
}
```

`app/api/customers/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { listCustomers } from '@/lib/queries/customers'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()
  return NextResponse.json(await listCustomers())
}
```

`app/api/taxes/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { listTaxes } from '@/lib/queries/taxes'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()
  return NextResponse.json(await listTaxes())
}
```

`app/api/settings/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { getSettings } from '@/lib/queries/settings'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()
  return NextResponse.json(await getSettings())
}
```

- [ ] **Step 8: Commit**

```bash
git add lib/auth-guard.ts app/api/
git commit -m "feat: add quotes, products, customers, taxes and settings API routes"
```

---

## Task 8: Sales — Quotes List Page

**Files:**
- Create: `app/(app)/quotes/page.tsx`

- [ ] **Step 1: Create `app/(app)/quotes/page.tsx`**

```tsx
import Link from 'next/link'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { listQuotesByUser } from '@/lib/queries/quotes'

const STATE_LABELS: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Borrador',   color: 'bg-gray-100 text-gray-600' },
  sent:      { label: 'Enviada',    color: 'bg-blue-100 text-blue-700' },
  confirmed: { label: 'Confirmada', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelada',  color: 'bg-red-100 text-red-600' },
  expired:   { label: 'Expirada',   color: 'bg-yellow-100 text-yellow-700' },
}

export default async function QuotesPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  const quotes = await listQuotesByUser(session.userId)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Mis Cotizaciones</h1>
        <Link
          href="/quotes/new"
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nueva Cotización
        </Link>
      </div>

      {quotes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No tienes cotizaciones aún.</p>
          <p className="text-sm mt-1">Crea tu primera cotización.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Número</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotes.map(q => {
                const s = STATE_LABELS[q.state] ?? { label: q.state, color: 'bg-gray-100 text-gray-600' }
                return (
                  <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-800">{q.number}</td>
                    <td className="px-4 py-3 text-gray-800">{q.customer_name}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(q.quotation_date).toLocaleDateString('es-MX')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      ${Number(q.amount_total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/quotes/${q.id}`} className="text-blue-600 hover:underline text-xs">Ver</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Login as sales1 → `/quotes` should show the list.

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/quotes/page.tsx
git commit -m "feat: add sales quotes list page"
```

---

## Task 9: Sales — New Quote + Quote Editor

**Files:**
- Create: `app/(app)/quotes/new/page.tsx`
- Create: `app/(app)/quotes/[id]/page.tsx`
- Create: `app/(app)/quotes/[id]/_components/LineEditor.tsx`
- Create: `app/(app)/quotes/[id]/_components/ProductSearch.tsx`

- [ ] **Step 1: Create `app/(app)/quotes/new/page.tsx`**

```tsx
'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

interface Customer { id: string; name: string }
interface PaymentTerm { id: string; name: string }

export default function NewQuotePage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(setCustomers)
    fetch('/api/settings').then(r => r.json()).then((s) => {
      // Load payment terms separately
    })
    fetch('/api/taxes').then(r => r.json()) // preload
  }, [])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)

    const res = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: form.get('customer_id'),
        payment_term_id: form.get('payment_term_id') || null,
        quotation_date: new Date().toISOString(),
        expiration_date: form.get('expiration_date') || null,
      }),
    })

    const quote = await res.json()
    setLoading(false)
    router.push(`/quotes/${quote.id}`)
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Nueva Cotización</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
          <select name="customer_id" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Seleccionar cliente...</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de expiración</label>
          <input name="expiration_date" type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50">
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Creando...' : 'Crear Cotización'}
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/(app)/quotes/[id]/_components/ProductSearch.tsx`**

```tsx
'use client'

import { useState, useEffect, useRef } from 'react'

interface Product {
  id: string; sku: string | null; name: string; currency: string
  cost_base: string; utility_fixed: string; utility_factor: string
}

interface Props {
  onSelect: (product: Product) => void
}

export default function ProductSearch({ onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [all, setAll] = useState<Product[]>([])
  const [showCatalog, setShowCatalog] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setAll)
  }, [])

  useEffect(() => {
    if (!query) { setResults([]); return }
    const t = setTimeout(async () => {
      const r = await fetch(`/api/products?q=${encodeURIComponent(query)}`)
      setResults(await r.json())
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  const displayed = query ? results : showCatalog ? all : []

  return (
    <div className="relative" ref={ref}>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Buscar por nombre o SKU..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setShowCatalog(true)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => setShowCatalog(v => !v)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
        >
          Catálogo
        </button>
      </div>

      {displayed.length > 0 && (
        <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {displayed.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => { onSelect(p); setQuery(''); setShowCatalog(false); setResults([]) }}
              className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-gray-50 last:border-0"
            >
              <p className="text-sm font-medium text-gray-900">{p.name}</p>
              <p className="text-xs text-gray-500">{p.sku ?? 'Sin SKU'} · {p.currency}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create `app/(app)/quotes/[id]/_components/LineEditor.tsx`**

```tsx
'use client'

import { useState, useEffect } from 'react'
import ProductSearch from './ProductSearch'

interface QuoteLine {
  id: string; display_type: string; name: string; qty: string | null
  discount_percent: string; unit_price_mxn_effective: string
  subtotal: string; tax_name?: string
}

interface Tax { id: string; name: string; rate: string }

interface Props {
  quoteId: string
  fxSnapshot: number
}

export default function LineEditor({ quoteId, fxSnapshot }: Props) {
  const [lines, setLines] = useState<QuoteLine[]>([])
  const [taxes, setTaxes] = useState<Tax[]>([])
  const [adding, setAdding] = useState(false)

  async function loadLines() {
    const r = await fetch(`/api/quotes/${quoteId}/lines`)
    setLines(await r.json())
  }

  useEffect(() => {
    loadLines()
    fetch('/api/taxes').then(r => r.json()).then(setTaxes)
  }, [quoteId])

  async function addProductLine(product: { id: string; name: string; currency: string; cost_base: string; utility_fixed: string; utility_factor: string }) {
    const costBase = Number(product.cost_base)
    const utilityFixed = Number(product.utility_fixed)
    const utilityFactor = Number(product.utility_factor)
    const fx = product.currency === 'USD' ? fxSnapshot : 1
    const suggested = (costBase * utilityFactor + utilityFixed) * fx

    await fetch(`/api/quotes/${quoteId}/lines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_type: 'product',
        product_id: product.id,
        name: product.name,
        qty: 1,
        currency_snapshot: product.currency,
        cost_base_snapshot: costBase,
        utility_fixed_snapshot: utilityFixed,
        utility_factor_snapshot: utilityFactor,
        fx_snapshot: fx,
        unit_price_mxn_suggested: suggested,
      }),
    })
    await loadLines()
  }

  async function addTextLine(type: 'section' | 'note') {
    const name = prompt(type === 'section' ? 'Título de sección:' : 'Nota:')
    if (!name) return
    await fetch(`/api/quotes/${quoteId}/lines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_type: type, name, qty: null }),
    })
    await loadLines()
  }

  async function deleteLine(lineId: string) {
    await fetch(`/api/quotes/${quoteId}/lines/${lineId}`, { method: 'DELETE' })
    await loadLines()
  }

  const subtotal = lines.filter(l => l.display_type === 'product')
    .reduce((s, l) => s + Number(l.subtotal), 0)

  return (
    <div>
      <div className="mb-3">
        <ProductSearch onSelect={addProductLine} />
      </div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => addTextLine('section')} type="button" className="text-xs border border-dashed border-gray-300 px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-50">
          + Sección
        </button>
        <button onClick={() => addTextLine('note')} type="button" className="text-xs border border-dashed border-gray-300 px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-50">
          + Nota
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">Descripción</th>
              <th className="text-right px-4 py-2.5 font-medium text-gray-600">Cant.</th>
              <th className="text-right px-4 py-2.5 font-medium text-gray-600">Precio</th>
              <th className="text-right px-4 py-2.5 font-medium text-gray-600">Desc %</th>
              <th className="text-right px-4 py-2.5 font-medium text-gray-600">Subtotal</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lines.map(line => {
              if (line.display_type === 'section') {
                return (
                  <tr key={line.id} className="bg-gray-50">
                    <td colSpan={5} className="px-4 py-2 font-semibold text-gray-700 text-xs uppercase tracking-wide">{line.name}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => deleteLine(line.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                    </td>
                  </tr>
                )
              }
              if (line.display_type === 'note') {
                return (
                  <tr key={line.id}>
                    <td colSpan={5} className="px-4 py-2 text-gray-500 italic text-xs">{line.name}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => deleteLine(line.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                    </td>
                  </tr>
                )
              }
              return (
                <tr key={line.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-800">{line.name}</td>
                  <td className="px-4 py-2.5 text-right text-gray-600">{line.qty}</td>
                  <td className="px-4 py-2.5 text-right text-gray-600">
                    ${Number(line.unit_price_mxn_effective).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-600">{line.discount_percent}%</td>
                  <td className="px-4 py-2.5 text-right font-medium text-gray-900">
                    ${Number(line.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => deleteLine(line.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <span className="text-sm font-semibold text-gray-900">
            Total: ${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
          </span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `app/(app)/quotes/[id]/page.tsx`**

```tsx
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { notFound } from 'next/navigation'
import { sessionOptions, SessionData } from '@/lib/session'
import { getQuote } from '@/lib/queries/quotes'
import LineEditor from './_components/LineEditor'
import QuoteActions from './_components/QuoteActions'

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  const quote = await getQuote(id)

  if (!quote) notFound()
  if (session.role === 'sales' && quote.user_id !== session.userId) notFound()

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{quote.number}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{quote.customer_name} · {new Date(quote.quotation_date).toLocaleDateString('es-MX')}</p>
        </div>
        <QuoteActions quoteId={id} currentState={quote.state} role={session.role} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Subtotal</p>
          <p className="text-lg font-semibold text-gray-900">${Number(quote.amount_untaxed).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">IVA</p>
          <p className="text-lg font-semibold text-gray-900">${Number(quote.amount_tax).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-blue-600 rounded-xl p-4">
          <p className="text-xs text-blue-200 mb-1">Total</p>
          <p className="text-lg font-semibold text-white">${Number(quote.amount_total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <LineEditor quoteId={id} fxSnapshot={Number(quote.fx_mxn_per_usd_snapshot)} />
    </div>
  )
}
```

- [ ] **Step 5: Create `app/(app)/quotes/[id]/_components/QuoteActions.tsx`**

```tsx
'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Props {
  quoteId: string
  currentState: string
  role: string
}

export default function QuoteActions({ quoteId, currentState, role }: Props) {
  const router = useRouter()

  async function changeState(state: string) {
    await fetch(`/api/quotes/${quoteId}/state`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    })
    router.refresh()
  }

  return (
    <div className="flex gap-2">
      {currentState === 'draft' && role === 'sales' && (
        <button onClick={() => changeState('sent')} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
          Enviar
        </button>
      )}
      {currentState === 'sent' && role === 'manager' && (
        <button onClick={() => changeState('confirmed')} className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700">
          Confirmar
        </button>
      )}
      {['draft','sent'].includes(currentState) && (
        <button onClick={() => changeState('cancelled')} className="border border-red-200 text-red-600 text-sm px-4 py-2 rounded-lg hover:bg-red-50">
          Cancelar
        </button>
      )}
      <Link
        href={`/api/pdf/${quoteId}`}
        target="_blank"
        className="border border-gray-200 text-gray-600 text-sm px-4 py-2 rounded-lg hover:bg-gray-50"
      >
        PDF
      </Link>
    </div>
  )
}
```

- [ ] **Step 6: Verify in browser**

Login as sales1 → create new quote → add products from catalog → see totals update.

- [ ] **Step 7: Commit**

```bash
git add app/\(app\)/quotes/
git commit -m "feat: add quote editor with product search, line management and actions"
```

---

## Task 10: PDF Generation

**Files:**
- Create: `components/pdf/QuotePDF.tsx`
- Create: `app/api/pdf/[id]/route.ts`

- [ ] **Step 1: Create `components/pdf/QuotePDF.tsx`**

```tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1d4ed8' },
  subtitle: { fontSize: 9, color: '#6b7280', marginTop: 2 },
  section: { marginBottom: 16 },
  label: { fontSize: 8, color: '#6b7280', textTransform: 'uppercase', marginBottom: 2 },
  value: { fontSize: 10 },
  table: { marginTop: 16 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', padding: '6 8', marginBottom: 1 },
  tableRow: { flexDirection: 'row', padding: '5 8', borderBottom: '1 solid #f3f4f6' },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: 'right' },
  totals: { marginTop: 12, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', gap: 16, marginBottom: 4 },
  totalLabel: { fontSize: 9, color: '#6b7280', width: 80, textAlign: 'right' },
  totalValue: { fontSize: 9, width: 80, textAlign: 'right' },
  grandTotal: { flexDirection: 'row', gap: 16, backgroundColor: '#1d4ed8', padding: '6 8', borderRadius: 4 },
  grandLabel: { fontSize: 10, color: 'white', fontWeight: 'bold', width: 80, textAlign: 'right' },
  grandValue: { fontSize: 10, color: 'white', fontWeight: 'bold', width: 80, textAlign: 'right' },
})

interface Line { id: string; name: string; qty: string | null; unit_price_mxn_effective: string; subtotal: string; display_type: string }
interface Quote { number: string; quotation_date: string; expiration_date: string | null; customer_name?: string; amount_untaxed: string; amount_tax: string; amount_total: string; terms: string | null }

export default function QuotePDF({ quote, lines }: { quote: Quote; lines: Line[] }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Cotización</Text>
            <Text style={styles.subtitle}>{quote.number}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.label}>Fecha</Text>
            <Text style={styles.value}>{new Date(quote.quotation_date).toLocaleDateString('es-MX')}</Text>
            {quote.expiration_date && (
              <>
                <Text style={[styles.label, { marginTop: 6 }]}>Válida hasta</Text>
                <Text style={styles.value}>{new Date(quote.expiration_date).toLocaleDateString('es-MX')}</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Cliente</Text>
          <Text style={styles.value}>{quote.customer_name}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.col1, { fontWeight: 'bold', fontSize: 8, color: '#6b7280' }]}>DESCRIPCIÓN</Text>
            <Text style={[styles.col2, { fontWeight: 'bold', fontSize: 8, color: '#6b7280' }]}>CANT.</Text>
            <Text style={[styles.col2, { fontWeight: 'bold', fontSize: 8, color: '#6b7280' }]}>PRECIO</Text>
            <Text style={[styles.col2, { fontWeight: 'bold', fontSize: 8, color: '#6b7280' }]}>SUBTOTAL</Text>
          </View>
          {lines.map(line => {
            if (line.display_type === 'section') {
              return (
                <View key={line.id} style={[styles.tableRow, { backgroundColor: '#f9fafb' }]}>
                  <Text style={{ flex: 4, fontWeight: 'bold', fontSize: 9, color: '#374151' }}>{line.name}</Text>
                </View>
              )
            }
            if (line.display_type === 'note') {
              return (
                <View key={line.id} style={styles.tableRow}>
                  <Text style={{ flex: 4, color: '#6b7280', fontStyle: 'italic' }}>{line.name}</Text>
                </View>
              )
            }
            return (
              <View key={line.id} style={styles.tableRow}>
                <Text style={styles.col1}>{line.name}</Text>
                <Text style={styles.col2}>{line.qty ?? 1}</Text>
                <Text style={styles.col2}>${Number(line.unit_price_mxn_effective).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Text>
                <Text style={styles.col2}>${Number(line.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Text>
              </View>
            )
          })}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>${Number(quote.amount_untaxed).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IVA</Text>
            <Text style={styles.totalValue}>${Number(quote.amount_tax).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text style={styles.grandLabel}>Total MXN</Text>
            <Text style={styles.grandValue}>${Number(quote.amount_total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Text>
          </View>
        </View>

        {quote.terms && (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.label}>Términos y condiciones</Text>
            <Text style={[styles.value, { color: '#6b7280', marginTop: 4 }]}>{quote.terms}</Text>
          </View>
        )}
      </Page>
    </Document>
  )
}
```

- [ ] **Step 2: Create `app/api/pdf/[id]/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { getQuote } from '@/lib/queries/quotes'
import { listLines } from '@/lib/queries/quote_lines'
import { renderToBuffer } from '@react-pdf/renderer'
import QuotePDF from '@/components/pdf/QuotePDF'
import { createElement } from 'react'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const quote = await getQuote(id)
  if (!quote) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (session.role === 'sales' && quote.user_id !== session.userId) return forbidden()

  const lines = await listLines(id)
  const buffer = await renderToBuffer(createElement(QuotePDF, { quote, lines }))

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${quote.number}.pdf"`,
    },
  })
}
```

- [ ] **Step 3: Verify PDF**

Open a quote → click "PDF" button → PDF should open in new tab.

- [ ] **Step 4: Commit**

```bash
git add components/ app/api/pdf/
git commit -m "feat: add PDF generation with react-pdf"
```

---

## Task 11: Manager Views

**Files:**
- Create: `app/(app)/manager/page.tsx`
- Create: `app/(app)/manager/[id]/page.tsx`

- [ ] **Step 1: Create `app/(app)/manager/page.tsx`**

```tsx
import Link from 'next/link'
import { listAllQuotes } from '@/lib/queries/quotes'

const STATE_LABELS: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Borrador',   color: 'bg-gray-100 text-gray-600' },
  sent:      { label: 'Enviada',    color: 'bg-blue-100 text-blue-700' },
  confirmed: { label: 'Confirmada', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelada',  color: 'bg-red-100 text-red-600' },
  expired:   { label: 'Expirada',   color: 'bg-yellow-100 text-yellow-700' },
}

export default async function ManagerPage() {
  const quotes = await listAllQuotes()

  const totals = {
    draft: quotes.filter(q => q.state === 'draft').length,
    sent: quotes.filter(q => q.state === 'sent').length,
    confirmed: quotes.filter(q => q.state === 'confirmed').length,
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Cotizaciones del Equipo</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Borradores</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{totals.draft}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Enviadas</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{totals.sent}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Confirmadas</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{totals.confirmed}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Número</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {quotes.map(q => {
              const s = STATE_LABELS[q.state] ?? { label: q.state, color: 'bg-gray-100 text-gray-600' }
              return (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{q.number}</td>
                  <td className="px-4 py-3">{q.customer_name}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(q.quotation_date).toLocaleDateString('es-MX')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    ${Number(q.amount_total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/manager/${q.id}`} className="text-blue-600 hover:underline text-xs">Ver</Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/(app)/manager/[id]/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import { getQuote } from '@/lib/queries/quotes'
import { listLines } from '@/lib/queries/quote_lines'
import Link from 'next/link'
import QuoteActions from '@/app/(app)/quotes/[id]/_components/QuoteActions'

export default async function ManagerQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const quote = await getQuote(id)
  if (!quote) notFound()
  const lines = await listLines(id)

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/manager" className="text-sm text-blue-600 hover:underline mb-2 block">← Volver</Link>
          <h1 className="text-xl font-semibold">{quote.number}</h1>
          <p className="text-sm text-gray-500">{quote.customer_name} · {new Date(quote.quotation_date).toLocaleDateString('es-MX')}</p>
        </div>
        <QuoteActions quoteId={id} currentState={quote.state} role="manager" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Descripción</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Cantidad</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Precio</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lines.map(line => (
              <tr key={line.id}>
                <td className="px-4 py-3">{line.name}</td>
                <td className="px-4 py-3 text-right">{line.qty ?? '-'}</td>
                <td className="px-4 py-3 text-right">${Number(line.unit_price_mxn_effective).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-right font-medium">${Number(line.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-8 text-sm">
          <span className="text-gray-500">Subtotal: <strong>${Number(quote.amount_untaxed).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></span>
          <span className="text-gray-500">IVA: <strong>${Number(quote.amount_tax).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></span>
          <span className="font-bold text-gray-900">Total: ${Number(quote.amount_total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify**

Login as manager → `/manager` shows all quotes with dashboard. Click one → can confirm/cancel.

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/manager/
git commit -m "feat: add manager views with all quotes and confirm/cancel actions"
```

---

## Task 12: Admin Views

**Files:**
- Create: `app/(app)/admin/page.tsx`
- Create: `app/(app)/admin/users/page.tsx`
- Create: `app/(app)/admin/products/page.tsx`
- Create: `app/(app)/admin/customers/page.tsx`
- Create: `app/(app)/admin/settings/page.tsx`
- Create: `app/api/admin/users/route.ts` + `[id]/route.ts`
- Create: `app/api/admin/products/route.ts` + `[id]/route.ts`
- Create: `app/api/admin/customers/route.ts` + `[id]/route.ts`
- Create: `app/api/admin/settings/route.ts`

- [ ] **Step 1: Create admin API routes**

`app/api/admin/users/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { listUsers, createUser } from '@/lib/queries/users'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  return NextResponse.json(await listUsers())
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  const { username, role, password } = await req.json()
  const hash = await bcrypt.hash(password, 10)
  const user = await createUser(username, role, hash)
  return NextResponse.json(user, { status: 201 })
}
```

`app/api/admin/users/[id]/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { updateUser, deleteUser } from '@/lib/queries/users'
import bcrypt from 'bcryptjs'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  const { id } = await params
  const body = await req.json()
  if (body.password) { body.password_hash = await bcrypt.hash(body.password, 10); delete body.password }
  await updateUser(id, body)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  const { id } = await params
  await deleteUser(id)
  return NextResponse.json({ ok: true })
}
```

`app/api/admin/products/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { listProducts, createProduct } from '@/lib/queries/products'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  return NextResponse.json(await listProducts())
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  const body = await req.json()
  const product = await createProduct(body)
  return NextResponse.json(product, { status: 201 })
}
```

`app/api/admin/products/[id]/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { updateProduct, deleteProduct } from '@/lib/queries/products'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  const { id } = await params
  await updateProduct(id, await req.json())
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  const { id } = await params
  await deleteProduct(id)
  return NextResponse.json({ ok: true })
}
```

`app/api/admin/customers/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { listCustomers, createCustomer } from '@/lib/queries/customers'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  return NextResponse.json(await listCustomers())
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  const { name } = await req.json()
  return NextResponse.json(await createCustomer(name), { status: 201 })
}
```

`app/api/admin/customers/[id]/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { updateCustomer, deleteCustomer } from '@/lib/queries/customers'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  const { id } = await params
  const { name } = await req.json()
  await updateCustomer(id, name)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  const { id } = await params
  await deleteCustomer(id)
  return NextResponse.json({ ok: true })
}
```

`app/api/admin/settings/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { getSettings, updateFx } from '@/lib/queries/settings'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  return NextResponse.json(await getSettings())
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  const { fx_mxn_per_usd } = await req.json()
  await updateFx(Number(fx_mxn_per_usd))
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Create `app/(app)/admin/page.tsx`**

```tsx
import Link from 'next/link'

const sections = [
  { href: '/admin/users',     label: 'Usuarios',       desc: 'Gestionar cuentas y roles' },
  { href: '/admin/products',  label: 'Productos',      desc: 'Catálogo, precios y costos' },
  { href: '/admin/customers', label: 'Clientes',       desc: 'Base de clientes' },
  { href: '/admin/settings',  label: 'Configuración',  desc: 'Tipo de cambio, impuestos, condiciones' },
]

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Panel de Administración</h1>
      <div className="grid grid-cols-2 gap-4">
        {sections.map(s => (
          <Link key={s.href} href={s.href} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all">
            <p className="font-medium text-gray-900">{s.label}</p>
            <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/(app)/admin/users/page.tsx`**

```tsx
'use client'

import { useState, useEffect } from 'react'

interface User { id: string; username: string; role: string }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [form, setForm] = useState({ username: '', role: 'sales', password: '' })
  const [adding, setAdding] = useState(false)

  async function load() {
    const r = await fetch('/api/admin/users')
    setUsers(await r.json())
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setForm({ username: '', role: 'sales', password: '' })
    setAdding(false)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar usuario?')) return
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Usuarios</h1>
        <button onClick={() => setAdding(v => !v)} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
          + Nuevo Usuario
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Usuario</label>
            <input value={form.username} onChange={e => setForm(f => ({...f, username: e.target.value}))} required className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-36" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Contraseña</label>
            <input type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-36" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Rol</label>
            <select value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="sales">Sales</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">Guardar</button>
          <button type="button" onClick={() => setAdding(false)} className="border border-gray-300 px-4 py-2 rounded-lg text-sm">Cancelar</button>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Usuario</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Rol</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{u.username}</td>
                <td className="px-4 py-3 capitalize">{u.role}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:text-red-700 text-xs">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `app/(app)/admin/products/page.tsx`**

```tsx
'use client'

import { useState, useEffect } from 'react'

interface Product { id: string; sku: string | null; name: string; currency: string; cost_base: string; utility_fixed: string; utility_factor: string }

const empty = { sku: '', name: '', currency: 'MXN', cost_base: '0', utility_fixed: '0', utility_factor: '1' }

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [form, setForm] = useState(empty)
  const [adding, setAdding] = useState(false)

  async function load() {
    const r = await fetch('/api/admin/products')
    setProducts(await r.json())
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setForm(empty)
    setAdding(false)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar producto?')) return
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Productos</h1>
        <button onClick={() => setAdding(v => !v)} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">+ Nuevo</button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-200 p-4 mb-4 grid grid-cols-3 gap-3">
          {(['name','sku'] as const).map(field => (
            <div key={field}>
              <label className="block text-xs text-gray-500 mb-1 capitalize">{field}</label>
              <input value={form[field] ?? ''} onChange={e => setForm(f => ({...f, [field]: e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          ))}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Moneda</label>
            <select value={form.currency} onChange={e => setForm(f => ({...f, currency: e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option>MXN</option><option>USD</option>
            </select>
          </div>
          {(['cost_base','utility_fixed','utility_factor'] as const).map(field => (
            <div key={field}>
              <label className="block text-xs text-gray-500 mb-1 capitalize">{field.replace('_',' ')}</label>
              <input type="number" step="0.01" value={form[field]} onChange={e => setForm(f => ({...f, [field]: e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          ))}
          <div className="col-span-3 flex gap-2 pt-1">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">Guardar</button>
            <button type="button" onClick={() => setAdding(false)} className="border border-gray-300 px-4 py-2 rounded-lg text-sm">Cancelar</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">SKU</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Moneda</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Costo base</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{p.name}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.sku ?? '-'}</td>
                <td className="px-4 py-3">{p.currency}</td>
                <td className="px-4 py-3 text-right">{p.cost_base}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 text-xs">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create `app/(app)/admin/customers/page.tsx`**

```tsx
'use client'

import { useState, useEffect } from 'react'

interface Customer { id: string; name: string }

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [name, setName] = useState('')
  const [adding, setAdding] = useState(false)

  async function load() {
    const r = await fetch('/api/admin/customers')
    setCustomers(await r.json())
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/admin/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    setName(''); setAdding(false); load()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar cliente?')) return
    await fetch(`/api/admin/customers/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Clientes</h1>
        <button onClick={() => setAdding(v => !v)} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">+ Nuevo</button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Nombre</label>
            <input value={name} onChange={e => setName(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">Guardar</button>
          <button type="button" onClick={() => setAdding(false)} className="border border-gray-300 px-4 py-2 rounded-lg text-sm">Cancelar</button>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700 text-xs">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create `app/(app)/admin/settings/page.tsx`**

```tsx
'use client'

import { useState, useEffect, FormEvent } from 'react'

export default function AdminSettingsPage() {
  const [fx, setFx] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(s => setFx(s?.fx_mxn_per_usd ?? ''))
  }, [])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fx_mxn_per_usd: Number(fx) }),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-sm">
      <h1 className="text-xl font-semibold mb-6">Configuración Global</h1>
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de cambio (MXN por USD)</label>
          <input
            type="number" step="0.0001" value={fx}
            onChange={e => setFx(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700">
          {saved ? '¡Guardado!' : 'Guardar'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 7: Verify admin**

Login as admin → navigate all admin pages → create/delete users, products, customers.

- [ ] **Step 8: Commit**

```bash
git add app/\(app\)/admin/ app/api/admin/
git commit -m "feat: add admin views and CRUD API routes for users, products, customers and settings"
```

---

## Final Checklist

- [ ] Login funciona para los 3 roles y redirige correctamente
- [ ] Sales ve solo sus cotizaciones
- [ ] Crear cotización → agregar líneas desde búsqueda y catálogo
- [ ] Cambios de estado funcionan (draft→sent→confirmed)
- [ ] PDF se genera y descarga correctamente
- [ ] Manager ve todas las cotizaciones y puede confirmar/cancelar
- [ ] Admin puede CRUD usuarios, productos, clientes, tipo de cambio
- [ ] Commit final con estado completo
