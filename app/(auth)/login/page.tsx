'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const form = new FormData(e.currentTarget)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.get('username'),
          password: form.get('password'),
        }),
      })

      let data: Record<string, string> = {}
      try {
        data = await res.json()
      } catch {
        throw new Error(`Error del servidor (${res.status})`)
      }

      if (!res.ok) {
        setError(data.error ?? 'Usuario o contraseña incorrectos')
        return
      }

      if (data.role === 'admin') router.push('/admin')
      else if (data.role === 'manager') router.push('/manager')
      else router.push('/quotes')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--c-base)' }}
    >
      {/* Left panel — brand */}
      <div
        className="hidden lg:flex flex-col justify-between w-80 shrink-0 p-10"
        style={{ background: 'var(--c-navy)' }}
      >
        <div>
          <div className="mb-12">
            <div className="flex flex-col gap-2">
              <Image
                src="/lumi-logo-white.svg"
                alt="LUMI"
                width={140}
                height={40}
                className="object-contain"
                priority
              />
              <div className="flex items-center gap-2 mt-2 opacity-60">
                <span className="text-[10px] text-white uppercase tracking-wider font-semibold">Partner</span>
                <Image
                  src="/logosmart.png"
                  unoptimized
                  alt="Smart Systems"
                  width={70}
                  height={22}
                  className="object-contain brightness-0 invert opacity-80"
                />
              </div>
            </div>
          </div>

          <p
            className="font-heading font-bold leading-tight"
            style={{ color: '#FFFFFF', fontSize: '1.85rem', letterSpacing: '0.02em' }}
          >
            Cotizador<br />Empresarial<br />LUMI
          </p>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Gestiona tu flota. Crea, envía y confirma cotizaciones de manera eficiente.
          </p>
        </div>

        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          © {new Date().getFullYear()} LUMI - QUOTES
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="lg:hidden mb-8 flex flex-col gap-2">
            <Image src="/lumi-logo.svg" alt="LUMI" width={120} height={36} className="object-contain" />
            <div className="flex items-center gap-2 opacity-50">
              <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--c-dim)' }}>Partner</span>
              <Image unoptimized src="/logosmart.png" alt="Smart Systems" width={60} height={18} className="object-contain grayscale opacity-80" />
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--c-ink)' }}>
              Iniciar sesión
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--c-ghost)' }}>
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: 'var(--c-dim)' }}
              >
                Usuario
              </label>
              <input
                name="username"
                type="text"
                required
                autoComplete="username"
                className="w-full"
                placeholder="nombre.usuario"
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: 'var(--c-dim)' }}
              >
                Contraseña
              </label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full"
              />
            </div>

            {error && (
              <div
                className="text-xs px-3 py-2.5 rounded-lg"
                style={{
                  background: 'var(--c-rose-bg)',
                  color: 'var(--c-rose)',
                  border: '1px solid rgba(209,44,60,0.2)',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 py-2.5 text-sm font-semibold rounded-lg transition-opacity"
              style={{
                background: loading ? 'var(--c-rim-hi)' : 'var(--c-navy)',
                color: loading ? 'var(--c-dim)' : '#FFFFFF',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.75 : 1,
              }}
            >
              {loading ? 'Verificando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
