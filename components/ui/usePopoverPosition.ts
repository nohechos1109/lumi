'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export function usePopoverPosition(estimatedPanelHeight = 340) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const toggle = useCallback(() => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - r.bottom - 8
      const top = spaceBelow >= estimatedPanelHeight
        ? r.bottom + 6
        : Math.max(8, r.top - estimatedPanelHeight - 6)
      setPos({ top, left: r.left })
    }
    setOpen(v => !v)
  }, [estimatedPanelHeight])

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const onOutside = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    const onClose = () => setOpen(false)
    document.addEventListener('mousedown', onOutside)
    window.addEventListener('scroll', onClose, true)
    window.addEventListener('resize', onClose)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      window.removeEventListener('scroll', onClose, true)
      window.removeEventListener('resize', onClose)
    }
  }, [open])

  return { open, setOpen, pos, btnRef, panelRef, toggle, close }
}
