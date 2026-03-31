'use client'

import { useEffect, useState } from 'react'

interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error'
}

export default function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    function handle(e: Event) {
      const { message, type } = (e as CustomEvent<{ message: string; type: 'success' | 'error' }>).detail
      const id = Date.now()
      setToasts(prev => [...prev, { id, message, type }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
    }
    window.addEventListener('app:toast', handle)
    return () => window.removeEventListener('app:toast', handle)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className="toast-item flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium pointer-events-auto"
          style={{
            background: t.type === 'error' ? 'var(--c-rose)' : 'var(--c-navy)',
            color: '#FFFFFF',
            minWidth: '220px',
            maxWidth: '360px',
            boxShadow: '0 4px 16px rgba(9,11,16,0.22)',
          }}
        >
          <span className="shrink-0 font-bold">
            {t.type === 'error' ? '✕' : '✓'}
          </span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
