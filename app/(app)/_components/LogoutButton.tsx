'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="btn-logout w-full text-left px-3 py-2 rounded-lg text-xs font-medium"
    >
      Cerrar sesión
    </button>
  )
}
