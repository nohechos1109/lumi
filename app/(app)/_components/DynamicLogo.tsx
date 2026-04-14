'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface LogoStyle {
  sublabel: string
  glowInner: string
  glowOuter: string
  lumiStart: string
  lumiEnd: string
  exact?: boolean
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
        width="170"
        height="46"
        viewBox="0 0 170 46"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Moon base */}
          <radialGradient id="lg-moonBase" cx="36%" cy="30%" r="66%">
            <stop offset="0%"   stopColor="#FFFFFF" />
            <stop offset="45%"  stopColor="#E8EDF5" />
            <stop offset="78%"  stopColor="#B8C8D8" />
            <stop offset="100%" stopColor="#7090A8" />
          </radialGradient>
          {/* Dynamic glow ring */}
          <radialGradient id="lg-moonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="55%"  stopColor={style.glowInner} stopOpacity="0.35" />
            <stop offset="80%"  stopColor={style.glowOuter} stopOpacity="0.15" />
            <stop offset="100%" stopColor={style.glowOuter} stopOpacity="0" />
          </radialGradient>
          <filter id="lg-blurGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          {/* Crater shadows */}
          <radialGradient id="lg-craterA" cx="40%" cy="35%" r="60%">
            <stop offset="0%"   stopColor="#7A6650" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#7A6650" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="lg-craterB" cx="40%" cy="35%" r="60%">
            <stop offset="0%"   stopColor="#8B7460" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#8B7460" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="lg-craterC" cx="40%" cy="35%" r="60%">
            <stop offset="0%"   stopColor="#7A6650" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#7A6650" stopOpacity="0" />
          </radialGradient>
          {/* Dynamic LUMI gradient */}
          <linearGradient id="lg-lumiGrad" x1="50" y1="14" x2="140" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor={style.lumiStart} />
            <stop offset="100%" stopColor={style.lumiEnd} />
          </linearGradient>
          {/* Dynamic sub-label gradient */}
          <linearGradient id="lg-labelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={style.glowInner} />
            <stop offset="100%" stopColor={style.glowOuter} />
          </linearGradient>
        </defs>

        {/* Glow ring */}
        <circle cx="23" cy="23" r="23" fill="url(#lg-moonGlow)" filter="url(#lg-blurGlow)" />

        {/* Moon body */}
        <circle cx="23" cy="23" r="19" fill="url(#lg-moonBase)" />

        {/* Large crater */}
        <ellipse cx="19" cy="13" rx="5" ry="4.5" fill="url(#lg-craterA)" />
        <ellipse cx="19" cy="13" rx="5" ry="4.5" fill="none" stroke="#F5EDD8" strokeWidth="0.6" opacity="0.35" />
        <ellipse cx="17.5" cy="11.5" rx="1.3" ry="0.9" fill="#F5EDD8" opacity="0.3" />

        {/* Medium crater */}
        <ellipse cx="29" cy="21" rx="3.5" ry="3" fill="url(#lg-craterB)" />
        <ellipse cx="29" cy="21" rx="3.5" ry="3" fill="none" stroke="#F5EDD8" strokeWidth="0.5" opacity="0.3" />
        <ellipse cx="27.8" cy="19.8" rx="1" ry="0.7" fill="#F5EDD8" opacity="0.25" />

        {/* Small crater */}
        <ellipse cx="15" cy="30" rx="3" ry="2.5" fill="url(#lg-craterC)" />
        <ellipse cx="15" cy="30" rx="3" ry="2.5" fill="none" stroke="#F5EDD8" strokeWidth="0.4" opacity="0.25" />
        <ellipse cx="14" cy="29" rx="0.9" ry="0.6" fill="#F5EDD8" opacity="0.2" />

        {/* Tiny craters */}
        <circle cx="25" cy="32" r="1.6" fill="#7A6650" opacity="0.4" />
        <circle cx="11" cy="19" r="1.3" fill="#7A6650" opacity="0.35" />
        <circle cx="28" cy="12" r="1.1" fill="#7A6650" opacity="0.3" />
        <circle cx="21" cy="34" r="1"   fill="#7A6650" opacity="0.3" />
        <circle cx="32" cy="29" r="0.9" fill="#7A6650" opacity="0.3" />

        {/* Surface highlight */}
        <ellipse cx="15" cy="17" rx="6" ry="4.5" fill="#F5EDD8" opacity="0.1" />

        {/* Edge highlight */}
        <path d="M8 13 Q5 17 5 23 Q5 29 8 33" stroke="#F5F0E0" strokeWidth="1" opacity="0.3" fill="none" strokeLinecap="round" />

        {/* LUMI wordmark */}
        <text
          x="50" y="30"
          fontFamily="system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
          fontWeight="900"
          fontSize="23"
          letterSpacing="2"
          fill="url(#lg-lumiGrad)"
        >LUMI</text>

        {/* Sub-label (hidden on home/dashboard) */}
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
