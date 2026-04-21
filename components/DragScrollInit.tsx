'use client'

import { useEffect } from 'react'

function attachDrag(el: HTMLElement): () => void {
  if (el.dataset.dragAttached) return () => {}
  el.dataset.dragAttached = '1'
  el.classList.add('drag-scroll')

  let isDown = false
  let startX = 0
  let scrollLeft = 0

  function onDown(e: MouseEvent) {
    const target = e.target as HTMLElement
    if (target.closest('a, button, input, select, textarea, [role="button"]')) return
    isDown = true
    startX = e.pageX - el.offsetLeft
    scrollLeft = el.scrollLeft
    el.classList.add('dragging')
  }
  function onUp() {
    isDown = false
    el.classList.remove('dragging')
  }
  function onMove(e: MouseEvent) {
    if (!isDown) return
    e.preventDefault()
    const x = e.pageX - el.offsetLeft
    el.scrollLeft = scrollLeft - (x - startX) * 1.2
  }

  el.addEventListener('mousedown', onDown)
  el.addEventListener('mouseleave', onUp)
  el.addEventListener('mouseup', onUp)
  el.addEventListener('mousemove', onMove)

  return () => {
    el.removeEventListener('mousedown', onDown)
    el.removeEventListener('mouseleave', onUp)
    el.removeEventListener('mouseup', onUp)
    el.removeEventListener('mousemove', onMove)
    delete el.dataset.dragAttached
  }
}

export default function DragScrollInit() {
  useEffect(() => {
    const cleanups = new Map<HTMLElement, () => void>()

    function scan() {
      document.querySelectorAll<HTMLElement>('.overflow-x-auto:not([data-no-drag])').forEach(el => {
        if (!cleanups.has(el)) {
          cleanups.set(el, attachDrag(el))
        }
      })
    }

    scan()

    const observer = new MutationObserver((mutations) => {
      mutations.forEach(m => {
        m.removedNodes.forEach(node => {
          if (!(node instanceof HTMLElement)) return
          const targets = [node, ...Array.from(node.querySelectorAll<HTMLElement>('.overflow-x-auto'))]
          targets.forEach(el => {
            cleanups.get(el)?.()
            cleanups.delete(el)
          })
        })
      })
      scan()
    })

    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      cleanups.forEach(cleanup => cleanup())
      cleanups.clear()
    }
  }, [])

  return null
}
