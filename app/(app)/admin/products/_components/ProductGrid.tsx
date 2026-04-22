'use client'

import { useState } from 'react'
import type { Product } from '@/lib/queries/products'

interface ProductGridProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
  fxRate?: number
}

interface CategoryMeta { bg: string; accent: string; icon: React.ReactNode }

function getCategoryMeta(category: string | null): CategoryMeta {
  const s = (category ?? '').toLowerCase()

  if (s.includes('camara') || s.includes('cámara'))
    return { bg: '#EFF6FF', accent: '#1C5AD6',
      icon: <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg> }

  if (s.includes('grabador'))
    return { bg: '#FFF7ED', accent: '#EA580C',
      icon: <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><path d="M6 6h.01M6 18h.01"/></svg> }

  if (s.includes('pantalla'))
    return { bg: '#F5F3FF', accent: '#7C3AED',
      icon: <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg> }

  if (s.includes('alarma'))
    return { bg: '#FFF1F2', accent: '#DC2626',
      icon: <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M2 8c0-2.2.7-4.3 2-6M22 8a10 10 0 0 0-2-6"/></svg> }

  if (s.includes('cableado') || s.includes('cable'))
    return { bg: '#F0FDF4', accent: '#16A34A',
      icon: <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16"/><path d="M4 10h16"/><path d="M7 6V4M17 6V4M7 10v2a5 5 0 0 0 10 0v-2"/><path d="M12 16v4M10 20h4"/></svg> }

  if (s.includes('boletera') || s.includes('bolet'))
    return { bg: '#FEFCE8', accent: '#CA8A04',
      icon: <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg> }

  if (s.includes('servicio'))
    return { bg: '#F8FAFC', accent: '#475569',
      icon: <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> }

  // default
  return { bg: '#F1F5F9', accent: '#64748B',
    icon: <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 2 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg> }
}

const fmt = (v: string | number) => Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })

function CardImage({ src, bg, accent, icon }: { src: string; bg: string; accent: string; icon: React.ReactNode }) {
  const [err, setErr] = useState(false)
  if (err) return <div className="w-full h-32 flex items-center justify-center" style={{ background: bg, color: accent }}>{icon}</div>
  return (
    <div className="w-full h-32 overflow-hidden" style={{ background: bg }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={() => setErr(true)} />
    </div>
  )
}

export default function ProductGrid({ products, onEdit, onDelete, fxRate = 1 }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl" style={{ border: '2px dashed var(--c-rim)', background: 'var(--c-panel)' }}>
        <p className="text-sm font-semibold" style={{ color: 'var(--c-dim)' }}>No se encontraron productos</p>
        <p className="text-xs mt-1" style={{ color: 'var(--c-ghost)' }}>Ajusta los filtros de búsqueda.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map(p => {
        const meta = getCategoryMeta(p.category)
        const publicPriceRaw = Number(p.cost_base) * Number(p.utility_factor) + Number(p.utility_fixed)
        const publicPrice = p.currency === 'USD' ? publicPriceRaw * fxRate : publicPriceRaw
        return (
          <div
            key={p.id}
            onClick={() => onEdit(p)}
            className="group flex flex-col rounded-xl overflow-hidden cursor-pointer"
            style={{
              background: 'var(--c-card)',
              border: '1px solid var(--c-rim)',
              transition: 'box-shadow 0.18s, transform 0.18s, border-color 0.18s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.boxShadow = '0 8px 24px rgba(15,23,42,0.09)'
              el.style.transform = 'translateY(-2px)'
              el.style.borderColor = 'var(--c-navy-bd)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.boxShadow = 'none'
              el.style.transform = 'translateY(0)'
              el.style.borderColor = 'var(--c-rim)'
            }}
          >
            {/* Image / placeholder */}
            {p.image_url ? (
              <CardImage src={p.image_url} bg={meta.bg} accent={meta.accent} icon={meta.icon} />
            ) : (
              <div className="w-full h-32 flex items-center justify-center" style={{ background: meta.bg, color: meta.accent }}>
                {meta.icon}
              </div>
            )}

            {/* Body */}
            <div className="flex flex-col flex-1 px-3 py-3 gap-1">
              {/* Category + currency */}
              <div className="flex items-center justify-between gap-1">
                {p.category && (
                  <span className="text-[10px] font-semibold truncate" style={{ color: meta.accent }}>
                    {p.category}
                  </span>
                )}
                <span
                  className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    background: p.currency === 'USD' ? 'rgba(28,90,214,0.09)' : 'rgba(5,150,105,0.09)',
                    color: p.currency === 'USD' ? '#1C5AD6' : '#059669',
                  }}
                >
                  {p.currency}
                </span>
              </div>

              {/* Name */}
              <p className="text-xs font-bold leading-snug" style={{ color: 'var(--c-ink)' }}>
                {p.name}
              </p>

              {/* SKU */}
              {p.sku && (
                <p className="text-[10px] font-mono" style={{ color: 'var(--c-ghost)' }}>{p.sku}</p>
              )}

              <div style={{ flex: 1 }} />

              {/* Pricing row */}
              <div
                className="grid grid-cols-3 gap-1 mt-2 pt-2"
                style={{ borderTop: '1px solid var(--c-rim)' }}
              >
                <div>
                  <p className="text-[9px] font-semibold uppercase" style={{ color: 'var(--c-ghost)' }}>Precio</p>
                  <p className="text-xs font-bold font-mono" style={{ color: 'var(--c-navy)' }}>
                    ${fmt(publicPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-semibold uppercase" style={{ color: 'var(--c-ghost)' }}>Costo</p>
                  <p className="text-xs font-mono" style={{ color: 'var(--c-dim)' }}>
                    ${fmt(p.cost_base)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-semibold uppercase" style={{ color: 'var(--c-ghost)' }}>Factor</p>
                  <p className="text-xs font-bold font-mono" style={{ color: 'var(--c-sky)' }}>
                    {Number(p.utility_factor).toFixed(2)}x
                  </p>
                </div>
              </div>

              {/* Delete */}
              <div className="flex justify-end mt-1">
                <button
                  onClick={e => { e.stopPropagation(); onDelete(p.id) }}
                  className="p-1.5 rounded-lg transition-all"
                  style={{ color: 'var(--c-ghost)' }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.color = 'var(--c-rose)'
                    el.style.background = 'rgba(209,44,60,0.07)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.color = 'var(--c-ghost)'
                    el.style.background = 'transparent'
                  }}
                  title="Eliminar"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
