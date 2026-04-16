'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface LogoStyle {
  sublabel: string
  glowInner: string
  glowOuter: string
  lumiStart: string
  lumiEnd: string
}

// Ordered most-specific → least-specific
const LOGO_CONFIG: Array<[string, LogoStyle]> = [
  ['/admin/unidades',           { sublabel: 'FLEET',     glowInner: '#22D3EE', glowOuter: '#0891B2', lumiStart: '#0891B2', lumiEnd: '#22D3EE' }],
  ['/admin/discount-approvals', { sublabel: 'DISCOUNTS', glowInner: '#FCD34D', glowOuter: '#D97706', lumiStart: '#D97706', lumiEnd: '#FCD34D' }],
  ['/admin/settings',           { sublabel: 'SETTINGS',  glowInner: '#94A3B8', glowOuter: '#64748B', lumiStart: '#64748B', lumiEnd: '#94A3B8' }],
  ['/admin/products',           { sublabel: 'PRODUCTS',  glowInner: '#34D399', glowOuter: '#059669', lumiStart: '#059669', lumiEnd: '#34D399' }],
  ['/admin/users',              { sublabel: 'USERS',     glowInner: '#93C5FD', glowOuter: '#2563EB', lumiStart: '#2563EB', lumiEnd: '#93C5FD' }],
  ['/admin/plantillas',         { sublabel: 'TEMPLATES', glowInner: '#C4B5FD', glowOuter: '#8B5CF6', lumiStart: '#8B5CF6', lumiEnd: '#C4B5FD' }],
  ['/admin/customers',          { sublabel: 'CUSTOMERS', glowInner: '#FCA5A5', glowOuter: '#DC2626', lumiStart: '#DC2626', lumiEnd: '#FCA5A5' }],
  ['/quotes',     { sublabel: 'QUOTES',     glowInner: '#6EE7B7', glowOuter: '#059669', lumiStart: '#059669', lumiEnd: '#34D399' }],
  ['/cobranza',   { sublabel: 'COLLECTION', glowInner: '#7DD3FC', glowOuter: '#0891B2', lumiStart: '#0891B2', lumiEnd: '#7DD3FC' }],
  ['/ventas',     { sublabel: 'COLLECTION', glowInner: '#7DD3FC', glowOuter: '#0891B2', lumiStart: '#0891B2', lumiEnd: '#7DD3FC' }],
  ['/pagos',      { sublabel: 'PAYMENTS',   glowInner: '#93C5FD', glowOuter: '#0369A1', lumiStart: '#0369A1', lumiEnd: '#60A5FA' }],
  ['/projects',   { sublabel: 'PROJECTS',   glowInner: '#7DD3FC', glowOuter: '#0284C7', lumiStart: '#0284C7', lumiEnd: '#7DD3FC' }],
  ['/catalog',    { sublabel: 'CATALOG',    glowInner: '#A5B4FC', glowOuter: '#6366F1', lumiStart: '#6366F1', lumiEnd: '#A5B4FC' }],
  ['/customers',  { sublabel: 'CUSTOMERS',  glowInner: '#FCA5A5', glowOuter: '#DC2626', lumiStart: '#DC2626', lumiEnd: '#FCA5A5' }],
  ['/convenios',  { sublabel: 'AGREEMENTS', glowInner: '#C4B5FD', glowOuter: '#7C3AED', lumiStart: '#7C3AED', lumiEnd: '#C4B5FD' }],
  ['/plantillas', { sublabel: 'TEMPLATES',  glowInner: '#C4B5FD', glowOuter: '#8B5CF6', lumiStart: '#8B5CF6', lumiEnd: '#C4B5FD' }],
  ['/servicios',  { sublabel: 'SERVICES',   glowInner: '#C4B5FD', glowOuter: '#7C3AED', lumiStart: '#7C3AED', lumiEnd: '#C4B5FD' }],
]

const DEFAULT_STYLE: LogoStyle = {
  sublabel: '',
  glowInner: '#93C5FD',
  glowOuter: '#2563EB',
  lumiStart: '#2563EB',
  lumiEnd: '#3B82F6',
}

function getLabelProps(label: string): { fontSize: number; letterSpacing: number } {
  const len = label.length
  if (len <= 6)  return { fontSize: 11,  letterSpacing: 4.5 }
  if (len <= 9)  return { fontSize: 9,   letterSpacing: 3.5 }
  if (len <= 12) return { fontSize: 8,   letterSpacing: 2.5 }
  return             { fontSize: 7.5, letterSpacing: 2 }
}

export default function DynamicLogo({ homeHref }: { homeHref: string }) {
  const pathname = usePathname()

  const match = LOGO_CONFIG.find(([prefix]) =>
    pathname === prefix || pathname.startsWith(prefix + '/')
  )
  const style = match?.[1] ?? DEFAULT_STYLE
  const sectionKey = match?.[0] ?? 'home'
  const { fontSize, letterSpacing } = getLabelProps(style.sublabel)

  return (
    <Link key={sectionKey} href={homeHref} className="flex items-center shrink-0 animate-fade-in">
      <svg
        width="168"
        height="46"
        viewBox="0 0 168 46"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Rounded square fill — section color */}
          <linearGradient id="lg-boxGrad" x1="2" y1="2" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor={style.lumiStart} />
            <stop offset="100%" stopColor={style.lumiEnd} />
          </linearGradient>

          {/* Glass inner highlight */}
          <radialGradient id="lg-innerLight" cx="30%" cy="22%" r="55%">
            <stop offset="0%"   stopColor="white" stopOpacity="0.16" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>

          {/* Drop shadow */}
          <filter id="lg-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={style.glowOuter} floodOpacity="0.32" />
          </filter>

          {/* LUMI wordmark gradient */}
          <linearGradient id="lg-lumiGrad" x1="52" y1="12" x2="148" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor={style.lumiStart} />
            <stop offset="100%" stopColor={style.lumiEnd} />
          </linearGradient>

          {/* Sub-label gradient */}
          <linearGradient id="lg-labelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={style.glowInner} />
            <stop offset="100%" stopColor={style.glowOuter} />
          </linearGradient>
        </defs>

        {/* ── Mark: L inside rounded square ─────────────── */}

        {/* Card */}
        <rect x="2" y="2" width="42" height="42" rx="11" fill="url(#lg-boxGrad)" filter="url(#lg-shadow)" />

        {/* Border highlight */}
        <rect x="2" y="2" width="42" height="42" rx="11" fill="none" stroke="white" strokeWidth="1" opacity="0.2" />

        {/* Glass inner reflection */}
        <rect x="2" y="2" width="42" height="42" rx="11" fill="url(#lg-innerLight)" />

        {/* L — vertical bar */}
        <rect x="12" y="9" width="8.5" height="27" rx="3" fill="white" opacity="0.96" />

        {/* L — horizontal bar */}
        <rect x="12" y="29" width="22" height="8.5" rx="3" fill="white" opacity="0.96" />

        {/* Lumen dot — soft outer glow */}
        <circle cx="33" cy="12" r="5.5" fill="white" opacity="0.10" />

        {/* Lumen dot — core */}
        <circle cx="33" cy="12" r="2.8" fill="white" opacity="0.52" />

        {/* Lumen dot — specular */}
        <circle cx="32.2" cy="11.3" r="1.1" fill="white" opacity="0.78" />

        {/* ── Wordmark ──────────────────────────────────── */}

        <text
          x="52" y="30"
          fontFamily="system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
          fontWeight="900"
          fontSize="23"
          letterSpacing="2"
          fill="url(#lg-lumiGrad)"
        >LUMI</text>

        {style.sublabel && (
          <text
            x="54" y="41"
            fontFamily="system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
            fontWeight="800"
            fontSize={fontSize}
            letterSpacing={letterSpacing}
            fill="url(#lg-labelGrad)"
          >{style.sublabel}</text>
        )}
      </svg>
    </Link>
  )
}
