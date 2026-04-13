# Odoo-Style App Launcher — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the left sidebar navigation with a top bar + overlay app-launcher grid (Odoo style) where every nav item appears as a color-coded icon card, role-filtered, using the existing design system.

**Architecture:** A fixed top bar replaces both the desktop sidebar and the mobile drawer. A "waffle" button in the top bar opens a full-screen overlay grid (`AppLauncherPanel`) containing one card per allowed route — each card has a custom inline SVG icon and an accent color. Clicking a card navigates and closes the panel. State (open/closed) lives in a thin client wrapper (`AppLauncherButton`) so the top bar itself can remain a server component.

**Tech Stack:** Next.js App Router, React 19, Tailwind CSS, inline SVG icons (Feather style, `stroke="currentColor"`), CSS custom properties from `globals.css`, iron-session for role data.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `app/(app)/_components/NavIcons.tsx` | Pure SVG exports — one named export per route icon |
| Create | `app/(app)/_components/AppLauncherPanel.tsx` | Client component: full-screen overlay grid of app cards |
| Create | `app/(app)/_components/AppLauncherButton.tsx` | Client component: waffle toggle button + mounts panel |
| Create | `app/(app)/_components/TopBar.tsx` | Server component: top bar shell with brand + user info; renders AppLauncherButton |
| Modify | `app/(app)/layout.tsx` | Remove aside + MobileNavbar; add TopBar; fix main padding |
| Delete | `app/(app)/_components/NavLinks.tsx` | Replaced by AppLauncherPanel cards |
| Modify | `app/(app)/_components/MobileNavbar.tsx` | Can be deleted — TopBar handles all breakpoints |

---

## Task 1: Create `NavIcons.tsx` — SVG icon library

**Files:**
- Create: `app/(app)/_components/NavIcons.tsx`

Each icon is a React component returning an `<svg>` with `width={28} height={28}`, `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `strokeWidth={1.8}`, `strokeLinecap="round"`, `strokeLinejoin="round"`. All Feather-style paths.

- [ ] **Step 1: Create the file**

```tsx
// app/(app)/_components/NavIcons.tsx
// Pure SVG icon components — Feather style, no external deps.

const props = {
  width: 28,
  height: 28,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function IconDashboard() {
  return (
    <svg {...props}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6"  y1="20" x2="6"  y2="14" />
    </svg>
  )
}

export function IconProjects() {
  return (
    <svg {...props}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

export function IconQuotes() {
  return (
    <svg {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

export function IconCatalog() {
  return (
    <svg {...props}>
      <rect x="3"  y="3"  width="7" height="7" />
      <rect x="14" y="3"  width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3"  y="14" width="7" height="7" />
    </svg>
  )
}

export function IconCustomers() {
  return (
    <svg {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

export function IconTemplates() {
  return (
    <svg {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3"  y1="9"  x2="21" y2="9" />
      <line x1="9"  y1="21" x2="9"  y2="9" />
    </svg>
  )
}

export function IconTeam() {
  return (
    <svg {...props}>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  )
}

export function IconUsers() {
  return (
    <svg {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <polyline points="17 11 19 13 23 9" />
    </svg>
  )
}

export function IconProducts() {
  return (
    <svg {...props}>
      <line x1="16.5" y1="9.4"  x2="7.5"  y2="4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )
}

export function IconDiscounts() {
  return (
    <svg {...props}>
      <line x1="19" y1="5" x2="5" y2="19" />
      <circle cx="6.5"  cy="6.5"  r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  )
}

export function IconSettings() {
  return (
    <svg {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
```

- [ ] **Step 2: Verify the file has no TypeScript errors**

```bash
npx tsc --noEmit
```
Expected: no errors related to NavIcons.tsx

- [ ] **Step 3: Commit**

```bash
git add app/(app)/_components/NavIcons.tsx
git commit -m "feat(launcher): add SVG icon library for app launcher cards"
```

---

## Task 2: Create `AppLauncherPanel.tsx` — overlay grid

**Files:**
- Create: `app/(app)/_components/AppLauncherPanel.tsx`

Client component. Receives `items` (extended NavItem with icon key + accent color) and an `onClose` callback. Renders a fixed full-screen backdrop + centered card grid. Pressing Escape or clicking the backdrop calls `onClose`. Navigating to a card calls `onClose` after routing.

- [ ] **Step 1: Define the extended NavItem type**

This type will be shared — add it to a new file `app/(app)/_components/nav-types.ts`:

```ts
// app/(app)/_components/nav-types.ts
export interface NavItem {
  href: string
  label: string
  exact?: boolean
  icon: string          // key into ICON_MAP in AppLauncherPanel
  color: string         // CSS color value for card accent
}
```

- [ ] **Step 2: Create `AppLauncherPanel.tsx`**

```tsx
'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import type { NavItem } from './nav-types'
import {
  IconDashboard, IconProjects, IconQuotes, IconCatalog,
  IconCustomers, IconTemplates, IconTeam, IconUsers,
  IconProducts, IconDiscounts, IconSettings,
} from './NavIcons'

const ICON_MAP: Record<string, React.ReactNode> = {
  dashboard:  <IconDashboard />,
  projects:   <IconProjects />,
  quotes:     <IconQuotes />,
  catalog:    <IconCatalog />,
  customers:  <IconCustomers />,
  templates:  <IconTemplates />,
  team:       <IconTeam />,
  users:      <IconUsers />,
  products:   <IconProducts />,
  discounts:  <IconDiscounts />,
  settings:   <IconSettings />,
}

interface Props {
  items: NavItem[]
  onClose: () => void
}

export default function AppLauncherPanel({ items, onClose }: Props) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 pb-8 overflow-y-auto"
      style={{ background: 'rgba(12,21,36,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="relative w-full max-w-2xl rounded-2xl p-8"
        style={{
          background: 'var(--c-panel)',
          border: '1px solid var(--c-rim)',
          boxShadow: '0 24px 64px rgba(27,52,97,0.18)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold" style={{ color: 'var(--c-ink)', fontFamily: 'var(--font-montserrat)' }}>
            Módulos
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--c-ghost)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            aria-label="Cerrar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {items.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="group flex flex-col items-center gap-2.5 rounded-xl p-4 transition-all"
              style={{ textDecoration: 'none' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'var(--c-hover)'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'transparent'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
              }}
            >
              {/* Icon circle */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm"
                style={{ background: item.color, color: '#fff' }}
              >
                {ICON_MAP[item.icon]}
              </div>
              {/* Label */}
              <span
                className="text-xs text-center leading-tight font-medium"
                style={{ color: 'var(--c-ink)', fontFamily: 'var(--font-montserrat)' }}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/(app)/_components/nav-types.ts app/(app)/_components/AppLauncherPanel.tsx
git commit -m "feat(launcher): add AppLauncherPanel overlay grid component"
```

---

## Task 3: Create `AppLauncherButton.tsx` — toggle button + portal

**Files:**
- Create: `app/(app)/_components/AppLauncherButton.tsx`

Client component. Receives `items: NavItem[]`. Manages `isOpen` boolean state. Renders the waffle/grid toggle button; when open, mounts `AppLauncherPanel` via `ReactDOM.createPortal` into `document.body`.

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { NavItem } from './nav-types'
import AppLauncherPanel from './AppLauncherPanel'

interface Props { items: NavItem[] }

export default function AppLauncherButton({ items }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
        style={{
          color: open ? 'var(--c-navy)' : 'var(--c-dim)',
          background: open ? 'var(--c-navy-bg)' : 'transparent',
        }}
        onMouseEnter={e => { if (!open) (e.currentTarget as HTMLElement).style.background = 'var(--c-hover)' }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        aria-label="Abrir menú de módulos"
        title="Módulos"
      >
        {/* Waffle icon — 3×3 grid of dots */}
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <rect x="1"  y="1"  width="4" height="4" rx="1" />
          <rect x="7"  y="1"  width="4" height="4" rx="1" />
          <rect x="13" y="1"  width="4" height="4" rx="1" />
          <rect x="1"  y="7"  width="4" height="4" rx="1" />
          <rect x="7"  y="7"  width="4" height="4" rx="1" />
          <rect x="13" y="7"  width="4" height="4" rx="1" />
          <rect x="1"  y="13" width="4" height="4" rx="1" />
          <rect x="7"  y="13" width="4" height="4" rx="1" />
          <rect x="13" y="13" width="4" height="4" rx="1" />
        </svg>
      </button>

      {open && typeof window !== 'undefined' &&
        createPortal(
          <AppLauncherPanel items={items} onClose={() => setOpen(false)} />,
          document.body
        )
      }
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(app)/_components/AppLauncherButton.tsx
git commit -m "feat(launcher): add AppLauncherButton toggle with portal"
```

---

## Task 4: Create `TopBar.tsx` — server component top bar

**Files:**
- Create: `app/(app)/_components/TopBar.tsx`

Server component. Receives `items`, `username`, `roleLabel`. Renders a fixed top bar with: logo | waffle button | spacer | notifications | user chip | logout. Height `h-14` (56px). Replaces both the sidebar and MobileNavbar.

- [ ] **Step 1: Create the file**

```tsx
import Image from 'next/image'
import Link from 'next/link'
import type { NavItem } from './nav-types'
import AppLauncherButton from './AppLauncherButton'
import LogoutButton from './LogoutButton'
import NotificationBell from '@/components/ui/NotificationBell'

interface Props {
  items: NavItem[]
  username: string
  roleLabel: string
  userInitial: string
}

export default function TopBar({ items, username, roleLabel, userInitial }: Props) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 h-14 flex items-center px-4 gap-3"
      style={{
        background: 'var(--c-panel)',
        borderBottom: '1px solid var(--c-rim)',
        boxShadow: '0 1px 8px rgba(27,52,97,0.06)',
      }}
    >
      {/* Logo — links to role home */}
      <Link href="/" className="flex items-center shrink-0">
        <Image src="/lumi-logo.svg" alt="LUMI" width={88} height={28} className="object-contain" priority />
      </Link>

      {/* Waffle launcher button */}
      <AppLauncherButton items={items} />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Notifications */}
      <NotificationBell />

      {/* User chip */}
      <div
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
        style={{ background: 'var(--c-base)' }}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs"
          style={{
            background: 'var(--c-navy-bg)',
            color: 'var(--c-navy)',
            border: '1.5px solid var(--c-navy-bd)',
          }}
        >
          {userInitial}
        </div>
        <div className="leading-tight">
          <p className="text-xs font-semibold" style={{ color: 'var(--c-ink)' }}>{username}</p>
          <p className="text-[10px]" style={{ color: 'var(--c-ghost)' }}>{roleLabel}</p>
        </div>
      </div>

      {/* Logout */}
      <LogoutButton />
    </header>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(app)/_components/TopBar.tsx
git commit -m "feat(launcher): add TopBar server component"
```

---

## Task 5: Update `app/(app)/layout.tsx` — wire everything together

**Files:**
- Modify: `app/(app)/layout.tsx`

Replace the `<aside>` block and `<MobileNavbar>` with `<TopBar>`. Extend navItems arrays with `icon` and `color` fields matching `NavIcons.tsx`. Fix `<main>` padding from `pt-14 md:pt-0` → `pt-14` (always, since top bar is always visible).

**Accent colors to use per route:**

| Route | color |
|-------|-------|
| Dashboard | `#1B3461` (navy) |
| Proyectos | `#1C5AD6` (sky) |
| Cotizaciones / Mis Cotizaciones | `#0B9962` (mint) |
| Catálogo | `#C47F08` (gold) |
| Clientes | `#D12C3C` (rose) |
| Plantillas | `#7C3AED` (violet) |
| Equipo | `#0891B2` (cyan) |
| Usuarios | `#1B3461` (navy) |
| Productos | `#0B9962` (mint) |
| Descuentos | `#C47F08` (gold) |
| Configuración | `#445566` (dim) |

- [ ] **Step 1: Rewrite `layout.tsx`**

```tsx
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import TopBar from './_components/TopBar'
import Toaster from '@/components/ui/Toaster'
import type { NavItem } from './_components/nav-types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  const navItems: Record<string, NavItem[]> = {
    sales: [
      { href: '/projects',   label: 'Proyectos',        icon: 'projects',  color: '#1C5AD6' },
      { href: '/quotes',     label: 'Mis Cotizaciones', icon: 'quotes',    color: '#0B9962' },
      { href: '/catalog',    label: 'Catálogo',         icon: 'catalog',   color: '#C47F08' },
      { href: '/customers',  label: 'Clientes',         icon: 'customers', color: '#D12C3C' },
      { href: '/plantillas', label: 'Plantillas',       icon: 'templates', color: '#7C3AED' },
    ],
    manager: [
      { href: '/projects',   label: 'Proyectos',    icon: 'projects',  color: '#1C5AD6' },
      { href: '/quotes',     label: 'Cotizaciones', icon: 'quotes',    color: '#0B9962' },
      { href: '/customers',  label: 'Clientes',     icon: 'customers', color: '#D12C3C' },
      { href: '/plantillas', label: 'Plantillas',   icon: 'templates', color: '#7C3AED' },
      { href: '/catalog',    label: 'Catálogo',     icon: 'catalog',   color: '#C47F08' },
      { href: '/manager',    label: 'Equipo',       icon: 'team',      color: '#0891B2' },
    ],
    admin: [
      { href: '/admin',                    label: 'Dashboard',    icon: 'dashboard', color: '#1B3461', exact: true },
      { href: '/projects',                 label: 'Proyectos',    icon: 'projects',  color: '#1C5AD6' },
      { href: '/quotes',                   label: 'Cotizaciones', icon: 'quotes',    color: '#0B9962' },
      { href: '/manager',                  label: 'Equipo',       icon: 'team',      color: '#0891B2' },
      { href: '/admin/users',              label: 'Usuarios',     icon: 'users',     color: '#1B3461' },
      { href: '/admin/products',           label: 'Productos',    icon: 'products',  color: '#0B9962' },
      { href: '/admin/discount-approvals', label: 'Descuentos',   icon: 'discounts', color: '#C47F08' },
      { href: '/admin/plantillas',         label: 'Plantillas',   icon: 'templates', color: '#7C3AED' },
      { href: '/admin/customers',          label: 'Clientes',     icon: 'customers', color: '#D12C3C' },
      { href: '/admin/settings',           label: 'Configuración',icon: 'settings',  color: '#445566' },
    ],
  }

  const items = navItems[session.role as keyof typeof navItems] ?? []

  const roleLabel: Record<string, string> = {
    sales:   'Ventas',
    manager: 'Gerente',
    admin:   'Administrador',
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--c-base)' }}>
      <TopBar
        items={items}
        username={session.username ?? ''}
        roleLabel={roleLabel[session.role] ?? session.role}
        userInitial={(session.username?.charAt(0) ?? '?').toUpperCase()}
      />

      <Toaster />

      <main className="pt-14 overflow-auto min-w-0">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Delete unused files**

```bash
git rm app/(app)/_components/NavLinks.tsx
git rm app/(app)/_components/MobileNavbar.tsx
```

- [ ] **Step 3: Run the dev server and verify manually**

```bash
npm run dev
```

Check:
- Top bar renders on desktop and mobile
- Waffle button opens the panel
- All cards for the logged-in role appear with correct icons and colors
- Clicking a card navigates and closes the panel
- Escape key closes the panel
- Backdrop click closes the panel
- No console errors

- [ ] **Step 4: Commit**

```bash
git add app/(app)/layout.tsx app/(app)/_components/TopBar.tsx
git commit -m "feat(launcher): replace sidebar with top bar + Odoo-style app launcher"
```

---

## Task 6: Polish — hover animation & active indicator on cards

**Files:**
- Modify: `app/(app)/_components/AppLauncherPanel.tsx`

Add active state: if `usePathname()` matches the item href, show a subtle ring around the card's icon circle and bold the label.

- [ ] **Step 1: Add pathname-aware active styling**

In `AppLauncherPanel.tsx`, import `usePathname` and derive `isActive` per item:

```tsx
import { usePathname } from 'next/navigation'

// inside component:
const pathname = usePathname()

// inside map:
const isActive = item.exact
  ? pathname === item.href
  : pathname === item.href || pathname.startsWith(item.href + '/')
```

Update the icon circle div to show active ring:

```tsx
<div
  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-transform"
  style={{
    background: item.color,
    color: '#fff',
    boxShadow: isActive
      ? `0 0 0 3px ${item.color}55, 0 4px 12px ${item.color}44`
      : '0 2px 8px rgba(0,0,0,0.12)',
  }}
>
  {ICON_MAP[item.icon]}
</div>
```

Update label to bold when active:

```tsx
<span
  className="text-xs text-center leading-tight"
  style={{
    color: isActive ? 'var(--c-navy)' : 'var(--c-ink)',
    fontWeight: isActive ? 700 : 500,
    fontFamily: 'var(--font-montserrat)',
  }}
>
  {item.label}
</span>
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/(app)/_components/AppLauncherPanel.tsx
git commit -m "feat(launcher): highlight active module in app launcher grid"
```

---

## Task 7: Final verification

- [ ] Test as `sales` role: 5 cards visible, correct icons
- [ ] Test as `manager` role: 6 cards visible
- [ ] Test as `admin` role: 10 cards visible
- [ ] Mobile (375px viewport): top bar fits, waffle button works, grid scrolls
- [ ] Keyboard: Tab through cards, Enter navigates, Escape closes
- [ ] No hydration errors in console (`suppressHydrationWarning` not needed — portal renders client-side only)
- [ ] Run build to catch any SSR issues:

```bash
npm run build
```

Expected: no errors, no warnings about missing exports.

- [ ] **Final commit / push**

```bash
git push origin dev
```
