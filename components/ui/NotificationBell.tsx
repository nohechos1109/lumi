'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  type: string
  title: string
  message: string | null
  entity: string | null
  entity_id: string | null
  read: boolean
  created_at: string
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return 'hace un momento'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} hr`
  return `hace ${Math.floor(diff / 86400)} días`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const fetchingRef = useRef(false)
  const router = useRouter()

  async function loadNotifications() {
    if (fetchingRef.current) return
    fetchingRef.current = true
    setLoading(true)
    try {
      const r = await fetch('/api/notifications')
      if (r.ok) setNotifications(await r.json())
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }

  async function markRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    try {
      const r = await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
      if (!r.ok) throw new Error()
    } catch {
      // Revert on failure
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: false } : n))
    }
  }

  async function markAllRead() {
    try {
      const r = await fetch('/api/notifications/read-all', { method: 'PATCH' })
      if (!r.ok) throw new Error()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch {
      // silently fail, next poll will refresh
    }
  }

  async function clearAll() {
    try {
      const r = await fetch('/api/notifications', { method: 'DELETE' })
      if (!r.ok) throw new Error()
      setNotifications([])
    } catch {
      // silently fail
    }
  }

  async function handleNotificationClick(n: Notification) {
    if (!n.read) await markRead(n.id)
    setOpen(false)
    if (n.entity === 'discount_approval' && n.entity_id) {
      router.push(`/admin/discount-approvals`)
    } else if (n.entity === 'quote' && n.entity_id) {
      router.push(`/quotes/${n.entity_id}`)
    }
  }

  // Load on mount
  useEffect(() => {
    loadNotifications()
  }, [])

  // Poll every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') loadNotifications()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handleToggle() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + 8, left: Math.max(8, rect.right - 300) })
      loadNotifications()
    }
    setOpen(prev => !prev)
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Bell button */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        type="button"
        aria-label={unreadCount > 0 ? `Notificaciones, ${unreadCount} sin leer` : 'Notificaciones'}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--c-ghost)',
        }}
      >
        {/* Bell SVG icon */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              background: 'var(--c-rose)',
              color: 'white',
              fontSize: '10px',
              borderRadius: '9999px',
              minWidth: '16px',
              height: '16px',
              padding: '0 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              fontWeight: 700,
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'fixed',
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: '300px',
            background: 'var(--c-card)',
            border: '1px solid var(--c-rim)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(9,11,16,0.18)',
            zIndex: 100,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid var(--c-rim)',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--c-ink)' }}>
              Notificaciones
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    color: 'var(--c-navy)',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    fontWeight: 600,
                  }}
                >
                  Marcar todas leídas
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    color: 'var(--c-ghost)',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    fontWeight: 600,
                  }}
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--c-ghost)' }}>
                Cargando...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--c-ghost)' }}>
                No hay notificaciones
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  type="button"
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 16px',
                    background: n.read ? 'transparent' : 'var(--c-navy-bg)',
                    border: 'none',
                    borderBottom: '1px solid var(--c-rim)',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    {/* Blue dot for unread */}
                    <div style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: n.read ? 'transparent' : 'var(--c-navy)',
                      marginTop: '5px',
                      flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--c-ink)',
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {n.title}
                      </p>
                      {n.message && (
                        <p style={{
                          fontSize: '12px',
                          color: 'var(--c-ghost)',
                          margin: '2px 0 0',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {n.message}
                        </p>
                      )}
                      <p style={{
                        fontSize: '11px',
                        color: 'var(--c-dim)',
                        margin: '3px 0 0',
                      }}>
                        {relativeTime(n.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
