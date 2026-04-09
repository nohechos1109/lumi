export function toast(message: string, type: 'success' | 'error' = 'success') {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type } }))
}

export function notifyRefresh() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('app:refresh-notifications'))
}
