'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [year, setYear] = useState<number | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setYear(new Date().getFullYear())
    setMounted(true)
  }, [])

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
      try { data = await res.json() } catch {
        throw new Error(`Error del servidor (${res.status})`)
      }

      if (!res.ok) {
        setError(data.error ?? 'Usuario o contraseña incorrectos')
        return
      }

      if (data.role === 'admin') router.push('/admin')
      else router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=DM+Sans:wght@400;500;600&display=swap');

        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F0F4FA;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
          padding: 24px;
        }

        /* Animated background orbs */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          animation: drift 12s ease-in-out infinite alternate;
          pointer-events: none;
        }
        .orb-1 {
          width: 520px; height: 520px;
          background: radial-gradient(circle, rgba(14,165,233,0.18) 0%, transparent 70%);
          top: -160px; left: -120px;
          animation-duration: 14s;
        }
        .orb-2 {
          width: 460px; height: 460px;
          background: radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%);
          bottom: -140px; right: -100px;
          animation-duration: 10s;
          animation-delay: -5s;
        }
        .orb-3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%);
          top: 50%; right: 15%;
          animation-duration: 16s;
          animation-delay: -8s;
        }
        @keyframes drift {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(40px, 30px) scale(1.08); }
        }

        /* Dot grid overlay */
        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(14,165,233,0.12) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
        }

        /* Card */
        .login-card {
          position: relative;
          width: 100%;
          max-width: 420px;
          background: rgba(255,255,255,0.85);
          border: 1px solid rgba(14,165,233,0.12);
          border-radius: 24px;
          padding: 40px 36px 32px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow:
            0 0 0 1px rgba(14,165,233,0.06),
            0 24px 64px rgba(14,165,233,0.1),
            0 4px 16px rgba(0,0,0,0.06);
          opacity: ${mounted ? 1 : 0};
          transform: ${mounted ? 'translateY(0)' : 'translateY(16px)'};
          transition: opacity 0.5s ease, transform 0.5s ease;
        }

        /* Logo area */
        .logo-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 32px;
          gap: 2px;
        }

        /* Headline */
        .login-headline {
          font-family: 'Montserrat', sans-serif;
          font-size: 26px;
          font-weight: 800;
          color: #0F172A;
          text-align: center;
          margin: 0 0 4px;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        .login-sub {
          font-size: 13px;
          color: #94A3B8;
          text-align: center;
          margin: 0 0 28px;
        }

        /* Inputs */
        .field-wrap {
          position: relative;
          margin-bottom: 16px;
        }
        .field-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #64748B;
          margin-bottom: 8px;
          transition: color 0.2s;
        }
        .field-label.active {
          color: #0EA5E9;
        }
        .field-input {
          width: 100%;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 13px 16px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #0F172A;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          box-sizing: border-box;
        }
        .field-input::placeholder { color: #CBD5E1; }
        .field-input:focus {
          background: #fff;
          border-color: #0EA5E9;
          box-shadow: 0 0 0 3px rgba(14,165,233,0.12);
        }

        /* Error */
        .error-box {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 12.5px;
          color: #FCA5A5;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Button */
        .login-btn {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          margin-top: 4px;
          position: relative;
          overflow: hidden;
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
          background: linear-gradient(135deg, #0EA5E9 0%, #0DD4A0 50%, #10B981 100%);
          color: #fff;
          box-shadow: 0 4px 24px rgba(14,165,233,0.35);
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(14,165,233,0.45);
        }
        .login-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .login-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
          pointer-events: none;
        }

        /* Shimmer on button when loading */
        .login-btn.loading::after {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 200%; height: 100%;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%);
          animation: shimmer 1.2s infinite;
        }
        @keyframes shimmer {
          from { left: -100%; }
          to   { left: 100%; }
        }

        /* Divider */
        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 24px 0 20px;
        }
        .divider-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.07);
        }
        .divider-line { background: #E2E8F0; }
        .divider-text {
          font-size: 11px;
          color: #CBD5E1;
          white-space: nowrap;
        }

        /* Partner */
        .partner-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .partner-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #CBD5E1;
        }

        /* Footer */
        .login-footer {
          position: absolute;
          bottom: 24px;
          left: 0; right: 0;
          text-align: center;
          font-size: 11px;
          color: #94A3B8;
        }
      `}</style>

      <div className="login-root">
        {/* Background effects */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="grid-overlay" />

        {/* Card */}
        <div className="login-card">
          {/* Logo */}
          <div className="logo-wrap">
            <Image
              src="/lumi-logo-saas.svg"
              alt="LUMI SAAS"
              width={256}
              height={74}
              className="object-contain"
              priority
            />
          </div>

          {/* Headline */}
          <h1 className="login-headline">Bienvenido de vuelta</h1>
          <p className="login-sub">Ingresa tus credenciales para continuar</p>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="field-wrap">
              <label
                className={`field-label ${focusedField === 'username' ? 'active' : ''}`}
                htmlFor="username"
              >
                Usuario
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                placeholder="nombre.usuario"
                className="field-input"
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
              />
            </div>

            <div className="field-wrap">
              <label
                className={`field-label ${focusedField === 'password' ? 'active' : ''}`}
                htmlFor="password"
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="field-input"
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
            </div>

            {error && (
              <div className="error-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`login-btn ${loading ? 'loading' : ''}`}
            >
              {loading ? 'Verificando...' : 'Ingresar'}
            </button>
          </form>

          {/* Divider + Partner */}
          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">powered by</span>
            <div className="divider-line" />
          </div>
          <div className="partner-row">
            <span className="partner-label">Partner</span>
            <Image
              src="/logosmart.png"
              unoptimized
              alt="Smart Systems"
              width={64}
              height={20}
              className="object-contain"
              style={{ opacity: 0.45 }}
            />
          </div>
        </div>

        {/* Footer */}
        <p className="login-footer">© {year ?? ''} LUMI - SAAS</p>
      </div>
    </>
  )
}
