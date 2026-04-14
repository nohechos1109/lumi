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
  ['/admin/unidades',           { sublabel: 'FLEET',     glowInner: '#22D3EE', glowOuter: '#0B7A8E', lumiStart: '#0B7A8E', lumiEnd: '#22D3EE' }],
  ['/admin/discount-approvals', { sublabel: 'DISCOUNTS', glowInner: '#FCD34D', glowOuter: '#C47F08', lumiStart: '#C47F08', lumiEnd: '#FCD34D' }],
  ['/admin/settings',           { sublabel: 'SETTINGS',  glowInner: '#94A3B8', glowOuter: '#445566', lumiStart: '#445566', lumiEnd: '#94A3B8' }],
  ['/admin/products',           { sublabel: 'PRODUCTS',  glowInner: '#34D399', glowOuter: '#0B9962', lumiStart: '#0B9962', lumiEnd: '#34D399' }],
  ['/admin/users',              { sublabel: 'USERS',     glowInner: '#60A5FA', glowOuter: '#1B3461', lumiStart: '#1B3461', lumiEnd: '#60A5FA' }],
  ['/admin/plantillas',         { sublabel: 'TEMPLATES', glowInner: '#A78BFA', glowOuter: '#7C3AED', lumiStart: '#7C3AED', lumiEnd: '#A78BFA' }],
  ['/admin/customers',          { sublabel: 'CUSTOMERS', glowInner: '#F87171', glowOuter: '#D12C3C', lumiStart: '#D12C3C', lumiEnd: '#F87171' }],
  ['/quotes',     { sublabel: 'QUOTES',     glowInner: '#38BDF8', glowOuter: '#0EA5E9', lumiStart: '#0EA5E9', lumiEnd: '#10B981' }],
  ['/cobranza',   { sublabel: 'COLLECTION', glowInner: '#34D399', glowOuter: '#059669', lumiStart: '#059669', lumiEnd: '#10B981' }],
  ['/ventas',     { sublabel: 'COLLECTION', glowInner: '#34D399', glowOuter: '#059669', lumiStart: '#059669', lumiEnd: '#10B981' }],
  ['/pagos',      { sublabel: 'PAYMENTS',   glowInner: '#60A5FA', glowOuter: '#0369A1', lumiStart: '#0369A1', lumiEnd: '#38BDF8' }],
  ['/projects',   { sublabel: 'PROJECTS',   glowInner: '#93C5FD', glowOuter: '#1C5AD6', lumiStart: '#1C5AD6', lumiEnd: '#60A5FA' }],
  ['/catalog',    { sublabel: 'CATALOG',    glowInner: '#FCD34D', glowOuter: '#C47F08', lumiStart: '#C47F08', lumiEnd: '#FCD34D' }],
  ['/customers',  { sublabel: 'CUSTOMERS',  glowInner: '#F87171', glowOuter: '#D12C3C', lumiStart: '#D12C3C', lumiEnd: '#F87171' }],
  ['/plantillas', { sublabel: 'TEMPLATES',  glowInner: '#A78BFA', glowOuter: '#7C3AED', lumiStart: '#7C3AED', lumiEnd: '#A78BFA' }],
]

const DEFAULT_STYLE: LogoStyle = {
  sublabel: '',
  glowInner: '#60A5FA',
  glowOuter: '#1B3461',
  lumiStart: '#1B3461',
  lumiEnd: '#60A5FA',
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
          {/* Mark gradient — L shape fill */}
          <linearGradient id="lg-markFill" x1="10" y1="7" x2="36" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor={style.lumiStart} />
            <stop offset="100%" stopColor={style.lumiEnd} />
          </linearGradient>

          {/* Soft area glow behind the whole mark */}
          <radialGradient id="lg-areaGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={style.glowInner} stopOpacity="0.14" />
            <stop offset="100%" stopColor={style.glowInner} stopOpacity="0" />
          </radialGradient>

          {/* Dot halo */}
          <radialGradient id="lg-dotHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={style.glowInner} stopOpacity="0.45" />
            <stop offset="100%" stopColor={style.glowInner} stopOpacity="0" />
          </radialGradient>

          {/* LUMI text gradient */}
          <linearGradient id="lg-lumiGrad" x1="50" y1="12" x2="148" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor={style.lumiStart} />
            <stop offset="100%" stopColor={style.lumiEnd} />
          </linearGradient>

          {/* Sub-label gradient */}
          <linearGradient id="lg-labelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={style.glowInner} />
            <stop offset="100%" stopColor={style.glowOuter} />
          </linearGradient>
        </defs>

        {/* ── Mark: L anagram + lumen dot ─────────────────── */}

        {/* Soft background glow */}
        <circle cx="23" cy="23" r="22" fill="url(#lg-areaGlow)" />

        {/* L — vertical bar */}
        <rect x="10" y="7" width="9.5" height="32" rx="3.5" fill="url(#lg-markFill)" />

        {/* L — horizontal bar */}
        <rect x="10" y="29.5" width="26" height="9.5" rx="3.5" fill="url(#lg-markFill)" />

        {/* Lumen dot — halo ring (outer) */}
        <circle cx="32" cy="13" r="9" fill="url(#lg-dotHalo)" />

        {/* Lumen dot — mid ring */}
        <circle cx="32" cy="13" r="5.5" fill={style.glowInner} opacity="0.28" />

        {/* Lumen dot — bright core */}
        <circle cx="32" cy="13" r="3.5" fill={style.glowInner} opacity="0.9" />

        {/* Lumen dot — specular highlight */}
        <circle cx="31" cy="12" r="1.2" fill="#ffffff" opacity="0.85" />

        {/* ── Wordmark ─────────────────────────────────────── */}

        {/* LUMI */}
        <text
          x="50" y="30"
          fontFamily="system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
          fontWeight="900"
          fontSize="23"
          letterSpacing="2"
          fill="url(#lg-lumiGrad)"
        >LUMI</text>

        {/* Sub-label (hidden on home / dashboard / admin root) */}
        {style.sublabel && (
          <text
            x="52" y="41"
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
