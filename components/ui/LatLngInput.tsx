'use client'

import { useState, useEffect } from 'react'
import { toast } from '@/lib/toast'

interface Props {
  lat: string | number | null
  lng: string | number | null
  onChange: (lat: string | null, lng: string | null) => void
  disabled?: boolean
}

function parsePair(text: string): { lat: string; lng: string } | null {
  const m = text.trim().match(/^\s*(-?\d+(?:\.\d+)?)\s*[,; ]\s*(-?\d+(?:\.\d+)?)\s*$/)
  if (!m) return null
  return { lat: m[1], lng: m[2] }
}

export default function LatLngInput({ lat, lng, onChange, disabled }: Props) {
  const [raw, setRaw] = useState(
    lat != null && lng != null ? `${lat}, ${lng}` : ''
  )
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    setRaw(lat != null && lng != null ? `${lat}, ${lng}` : '')
  }, [lat, lng])

  function apply(next: string) {
    setRaw(next)
    const parsed = parsePair(next)
    if (!next.trim()) { onChange(null, null); return }
    if (parsed) { onChange(parsed.lat, parsed.lng) }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      toast('Geolocalización no disponible en este navegador', 'error')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const la = pos.coords.latitude.toFixed(6)
        const lo = pos.coords.longitude.toFixed(6)
        apply(`${la}, ${lo}`)
        setLocating(false)
      },
      err => {
        toast(`No se pudo obtener ubicación: ${err.message}`, 'error')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const parsed = parsePair(raw)
  const mapsUrl = parsed ? `https://www.google.com/maps?q=${parsed.lat},${parsed.lng}` : null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={raw}
          disabled={disabled}
          onChange={e => apply(e.target.value)}
          placeholder="lat, lng  (ej: 20.6736, -103.344)"
          className="flex-1 text-sm rounded-xl px-4 py-2.5"
          style={{
            background: 'var(--c-panel)',
            border: '1px solid var(--c-rim)',
            color: 'var(--c-ink)',
            outline: 'none',
          }}
        />
        <button
          type="button"
          disabled={disabled || locating}
          onClick={useMyLocation}
          className="text-xs font-semibold px-3 rounded-xl"
          style={{
            background: 'var(--c-panel)',
            border: '1px solid var(--c-rim)',
            color: 'var(--c-ink)',
            cursor: disabled || locating ? 'not-allowed' : 'pointer',
            opacity: disabled || locating ? 0.5 : 1,
          }}
        >
          {locating ? '…' : 'Mi ubicación'}
        </button>
      </div>
      {mapsUrl && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold self-start"
          style={{ color: 'var(--c-navy)' }}
        >
          Ver en Google Maps ↗
        </a>
      )}
      {raw.trim() && !parsed && (
        <p className="text-xs" style={{ color: 'var(--c-rose)' }}>
          Formato inválido — usa &quot;lat, lng&quot;.
        </p>
      )}
    </div>
  )
}
