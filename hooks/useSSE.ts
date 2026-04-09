'use client'
import { useEffect, useRef } from 'react'

type SSEHandler = (data: unknown) => void

const RECONNECT_INITIAL_MS = 3_000
const RECONNECT_MAX_MS = 30_000
const MAX_RETRIES = 10

export function useSSE(handlers: Record<string, SSEHandler>) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    let unmounted = false
    let retries = 0
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let delay = RECONNECT_INITIAL_MS
    let es: EventSource | null = null

    function connect() {
      if (unmounted) return

      es = new EventSource('/api/sse')

      es.addEventListener('connected', () => {
        retries = 0
        delay = RECONNECT_INITIAL_MS
      })

      for (const eventName of Object.keys(handlersRef.current)) {
        es.addEventListener(eventName, (e: MessageEvent) => {
          try {
            handlersRef.current[eventName]?.(JSON.parse(e.data))
          } catch { /* malformed JSON */ }
        })
      }

      es.onerror = () => {
        es?.close()
        if (unmounted) return
        if (retries >= MAX_RETRIES) return
        retries++
        reconnectTimer = setTimeout(() => {
          delay = Math.min(delay * 2, RECONNECT_MAX_MS)
          connect()
        }, delay)
      }
    }

    connect()

    return () => {
      unmounted = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      es?.close()
    }
  }, []) // mount once — handlers stay current via ref
}
