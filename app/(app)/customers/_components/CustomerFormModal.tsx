'use client'

import { useState, useEffect, useRef } from 'react'
import { toast, notifyRefresh } from '@/lib/toast'

export interface ContactSaved {
  id: string
  type: 'company' | 'person'
  name: string
  email: string | null
  phone: string | null
  first_name: string | null
  job_title: string | null
  tax_id: string | null
  companies: { id: string; name: string; role: string | null; is_primary: boolean }[]
}

// Backward compat
export type CustomerSaved = ContactSaved

interface Props {
  customer: ContactSaved | null
  onClose: () => void
  onSaved: (contact: ContactSaved) => void
}

interface Company { id: string; name: string }

const inputClass = 'w-full px-3 py-2 rounded-lg text-sm outline-none transition-shadow'
const inputStyle = { background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)' }
const focusStyle = '1.5px solid var(--c-navy-bd)'
const blurStyle = '1px solid var(--c-rim)'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>
        {label} {required && <span style={{ color: 'var(--c-rose)' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

export function CustomerFormModal({ customer, onClose, onSaved }: Props) {
  const isEdit = customer !== null

  const [name, setName]       = useState(customer?.name ?? '')
  const [email, setEmail]     = useState(customer?.email ?? '')
  const [phone, setPhone]     = useState(customer?.phone ?? '')

  const [taxId, setTaxId]     = useState(customer?.tax_id ?? '')
  const [saving, setSaving]       = useState(false)

  // Mode chip: empresa | persona
  const [mode, setMode] = useState<'company' | 'person'>(
    customer?.type ?? 'company'
  )
  const [companies, setCompanies] = useState<Company[]>([])
  const [linkedCompanies, setLinkedCompanies] = useState<{ id: string; name: string; role: string; is_primary: boolean }[]>(
    customer?.companies?.map(c => ({ id: c.id, name: c.name, role: c.role ?? '', is_primary: c.is_primary })) ?? []
  )
  const [companySearch, setCompanySearch]         = useState('')
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)
  const companySearchRef = useRef<HTMLInputElement>(null)
  const dropdownRef      = useRef<HTMLDivElement>(null)

  const derivedType = mode

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    if (mode === 'person') {
      fetch('/api/customers')
        .then(r => r.json())
        .then((data: ContactSaved[]) =>
          setCompanies(data.filter(c => c.type === 'company').map(c => ({ id: c.id, name: c.name })))
        )
        .catch(() => {})
    }
  }, [mode])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        companySearchRef.current && !companySearchRef.current.contains(e.target as Node)
      ) setShowCompanyDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function addCompanyLink(company: Company) {
    if (linkedCompanies.some(c => c.id === company.id)) return
    setLinkedCompanies(prev => [...prev, { id: company.id, name: company.name, role: '', is_primary: prev.length === 0 }])
    setCompanySearch('')
    setShowCompanyDropdown(false)
  }

  function removeCompanyLink(id: string) {
    setLinkedCompanies(prev => prev.filter(c => c.id !== id))
  }

  async function createAndLinkCompany(companyName: string) {
    if (!companyName) return
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'company', name: companyName, phone: '—' }),
      })
      if (!res.ok) { toast('Error al crear empresa', 'error'); return }
      const created: ContactSaved = await res.json()
      const company = { id: created.id, name: created.name }
      setCompanies(prev => [...prev, company])
      addCompanyLink(company)
    } catch {
      toast('Error al crear empresa', 'error')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    if (!phone.trim()) { toast('El teléfono es requerido', 'error'); return }
    setSaving(true)
    try {
      const type = isEdit ? (customer.type) : derivedType
      const payload = {
        type,
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim(),
        first_name: type === 'person' ? name.trim() : null,
        job_title: null,

        tax_id: taxId.trim() || null,
      }

      const res = isEdit
        ? await fetch(`/api/customers/${customer.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast(data.error ?? 'Error al guardar', 'error')
        return
      }

      const saved: ContactSaved = isEdit ? { ...customer, ...payload, companies: customer.companies } : await res.json()

      // Sync company links
      if (mode === 'person') {
        const contactId = saved.id
        const prevIds = new Set(customer?.companies?.map(c => c.id) ?? [])
        const newIds  = new Set(linkedCompanies.map(c => c.id))

        await Promise.all([...prevIds].filter(id => !newIds.has(id)).map(companyId =>
          fetch(`/api/contacts/${contactId}/companies/${companyId}`, { method: 'DELETE' })
        ))
        await Promise.all(linkedCompanies.filter(c => !prevIds.has(c.id)).map(c =>
          fetch(`/api/contacts/${contactId}/companies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company_id: c.id, role: c.role || null, is_primary: c.is_primary }),
          })
        ))
        saved.companies = linkedCompanies.map(c => ({ id: c.id, name: c.name, role: c.role || null, is_primary: c.is_primary }))
      }

      notifyRefresh()
      toast(isEdit ? 'Contacto actualizado' : 'Contacto creado', 'success')
      onSaved(saved)
    } finally {
      setSaving(false)
    }
  }

  const availableCompanies = companies.filter(c => !linkedCompanies.some(l => l.id === c.id))
  const filteredCompanies  = availableCompanies.filter(c =>
    c.name.toLowerCase().includes(companySearch.toLowerCase())
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(9,11,16,0.5)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-form-title"
        className="w-full max-w-lg rounded-2xl p-6 flex flex-col gap-5 overflow-y-auto"
        style={{
          background: 'var(--c-card)',
          border: '1px solid var(--c-rim)',
          boxShadow: '0 8px 32px rgba(9,11,16,0.24)',
          maxHeight: '90vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 id="contact-form-title" className="text-base font-bold" style={{ color: 'var(--c-ink)' }}>
          {isEdit ? 'Editar contacto' : 'Nuevo contacto'}
        </h2>

        {/* Chips Empresa / Persona */}
        {!isEdit && (
          <div className="flex gap-2">
            {(['company', 'person'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => { setMode(t); if (t === 'company') setLinkedCompanies([]) }}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={mode === t
                  ? { background: 'var(--c-navy)', color: '#fff', border: '1px solid var(--c-navy)' }
                  : { background: 'var(--c-panel)', color: 'var(--c-dim)', border: '1px solid var(--c-rim)' }
                }
              >
                {t === 'company' ? 'Empresa' : 'Persona'}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Nombre */}
          <Field label="Nombre" required>
            <input
              className={inputClass} style={inputStyle}
              value={name} onChange={e => setName(e.target.value)}
              placeholder={mode === 'company' ? 'Empresa S.A. de C.V.' : 'Juan Pérez'} required autoFocus
              onFocus={e => { e.currentTarget.style.border = focusStyle }}
              onBlur={e => { e.currentTarget.style.border = blurStyle }}
            />
          </Field>

          {/* Email + Teléfono */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <input
                type="email" className={inputClass} style={inputStyle}
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                onFocus={e => { e.currentTarget.style.border = focusStyle }}
                onBlur={e => { e.currentTarget.style.border = blurStyle }}
              />
            </Field>
            <Field label="Teléfono" required>
              <input
                type="tel" className={inputClass} style={inputStyle}
                value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+52 55 0000 0000" required
                onFocus={e => { e.currentTarget.style.border = focusStyle }}
                onBlur={e => { e.currentTarget.style.border = blurStyle }}
              />
            </Field>
          </div>

          {/* RFC */}
          <Field label="RFC">
            <input
              className={inputClass} style={inputStyle}
              value={taxId} onChange={e => setTaxId(e.target.value)}
              placeholder="ABC123456XYZ"
              onFocus={e => { e.currentTarget.style.border = focusStyle }}
              onBlur={e => { e.currentTarget.style.border = blurStyle }}
            />
          </Field>

          {/* Sección de empresa vinculada — solo para persona */}
          {mode === 'person' && (
            <div className="flex flex-col gap-2 rounded-xl p-3" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)' }}>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>
                Empresa vinculada
              </span>

              {/* Empresas vinculadas */}
              {linkedCompanies.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {linkedCompanies.map(c => (
                    <div
                      key={c.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                      style={{ background: 'var(--c-card)', border: c.is_primary ? '1px solid var(--c-navy-bd)' : '1px solid var(--c-rim)' }}
                    >
                      <span className="flex-1 font-medium" style={{ color: 'var(--c-ink)' }}>{c.name}</span>
                      <input
                        type="text"
                        value={c.role}
                        onChange={e => setLinkedCompanies(prev => prev.map(l => l.id === c.id ? { ...l, role: e.target.value } : l))}
                        placeholder="Cargo…"
                        className="text-xs px-2 py-0.5 rounded outline-none min-w-0 w-28"
                        style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-dim)' }}
                        onFocus={e => { e.currentTarget.style.border = '1px solid var(--c-navy-bd)'; e.currentTarget.style.color = 'var(--c-ink)' }}
                        onBlur={e => { e.currentTarget.style.border = '1px solid var(--c-rim)'; e.currentTarget.style.color = 'var(--c-dim)' }}
                      />
                      <button
                        type="button"
                        title={c.is_primary ? 'Empresa principal' : 'Marcar como principal'}
                        onClick={() => setLinkedCompanies(prev => prev.map(l => ({ ...l, is_primary: l.id === c.id })))}
                        className="text-xs px-1.5 py-0.5 rounded shrink-0 transition-all"
                        style={c.is_primary
                          ? { background: 'var(--c-navy-bg)', color: 'var(--c-navy)', border: '1px solid var(--c-navy-bd)', fontWeight: 600, fontSize: '10px' }
                          : { background: 'transparent', color: 'var(--c-ghost)', border: '1px solid var(--c-rim)', fontWeight: 400, fontSize: '10px', opacity: 0.5 }
                        }
                      >
                        principal
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCompanyLink(c.id)}
                        className="opacity-40 hover:opacity-100 transition-opacity shrink-0"
                        style={{ color: 'var(--c-rose)' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Buscador de empresas */}
              <div className="flex flex-col gap-1">
                <input
                  ref={companySearchRef}
                  type="text"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)' }}
                  placeholder="Buscar empresa…"
                  value={companySearch}
                  onChange={e => { setCompanySearch(e.target.value); setShowCompanyDropdown(true) }}
                  onFocus={() => setShowCompanyDropdown(true)}
                  autoComplete="off"
                />
                {showCompanyDropdown && companySearch && (
                  <div
                    ref={dropdownRef}
                    className="rounded-lg overflow-hidden"
                    style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)' }}
                  >
                    <button
                      type="button"
                      onMouseDown={e => { e.preventDefault(); createAndLinkCompany(companySearch.trim()) }}
                      className="w-full text-left px-3 py-2 text-sm font-semibold transition-colors hover:bg-[var(--c-panel)]"
                      style={{ color: 'var(--c-navy)', borderBottom: '1px solid var(--c-rim)' }}
                    >
                      + Crear &ldquo;{companySearch.trim()}&rdquo;
                    </button>
                    {filteredCompanies.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onMouseDown={e => { e.preventDefault(); addCompanyLink(c) }}
                        className="w-full text-left px-3 py-2 text-sm transition-colors hover:bg-[var(--c-panel)]"
                        style={{ color: 'var(--c-ink)', borderBottom: '1px solid var(--c-rim)' }}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          <div className="flex gap-3 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm transition-opacity hover:opacity-75"
              style={{ background: 'transparent', color: 'var(--c-dim)', border: '1px solid var(--c-rim)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-50"
              style={{ background: 'var(--c-navy)', color: '#FFFFFF' }}
            >
              {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear contacto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
