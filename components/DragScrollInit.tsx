'use client'

import { useEffect } from 'react'

function attachDrag(el: HTMLElement) {
  if (el.dataset.dragAttached) return
  el.dataset.dragAttached = '1'
  el.classList.add('drag-scroll')

  let isDown = false
  let startX = 0
  let scrollLeft = 0

  function onDown(e: MouseEvent) {
    // Only drag on the container itself, not on links/buttons/inputs
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
}

export default function DragScrollInit() {
  useEffect(() => {
    function scan() {
      document.querySelectorAll<HTMLElement>('.overflow-x-auto').forEach(attachDrag)
    }

    scan()

    const observer = new MutationObserver(scan)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return null
}
