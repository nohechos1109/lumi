export const PAYMENT_METHODS = [
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'efectivo',      label: 'Efectivo' },
  { value: 'cheque',        label: 'Cheque' },
  { value: 'tarjeta',       label: 'Tarjeta' },
  { value: 'otro',          label: 'Otro' },
] as const

export const METHOD_LABELS: Record<string, string> = Object.fromEntries(
  PAYMENT_METHODS.map(m => [m.value, m.label])
)

export const PAYMENT_STATE_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  draft:     { bg: '#DBEAFE', color: '#1D4ED8', label: 'Borrador' },
  confirmed: { bg: '#DCFCE7', color: '#15803D', label: 'Confirmado' },
  cancelled: { bg: '#FFE4E6', color: '#BE123C', label: 'Cancelado' },
}
