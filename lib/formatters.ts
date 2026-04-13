export const fmtMXN = (v: string | number | null | undefined): string =>
  v != null ? Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 }) : '—'

export const fmtDate = (v: string | null): string => {
  if (!v) return '—'
  const s = String(v).slice(0, 10)
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return s
  return `${m[3]}/${m[2]}/${m[1]}`
}
