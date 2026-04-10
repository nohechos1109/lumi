// Funciones de permiso nombradas por CAPACIDAD, no por grupo de rol.
// Para diferenciar almacen/soporte/sales en el futuro, edita solo la función correspondiente.

export function canViewOwnQuotesOnly(role: string) {
  return role === 'sales' || role === 'almacen' || role === 'soporte'
}

export function canViewOwnProjectsOnly(role: string) {
  return role === 'sales' || role === 'almacen' || role === 'soporte'
}

export function canSetManualPrice(role: string) {
  return role !== 'sales' && role !== 'almacen' && role !== 'soporte'
}

export function canRequestDiscounts(role: string) {
  return role === 'sales' || role === 'almacen' || role === 'soporte'
}

export function canDeleteCustomers(role: string) {
  return role !== 'sales' && role !== 'almacen' && role !== 'soporte'
}

export function canAccessDeleteRequests(role: string) {
  return role !== 'sales' && role !== 'almacen' && role !== 'soporte'
}

export function canAccessManagerSection(role: string) {
  return role === 'manager' || role === 'admin'
}

export function canAccessShowroomQuotes(role: string) {
  return role !== 'sales'
}

// ── Cobranza (Ventas / Pagos) ─────────────────────────────────

export function canViewOwnSalesOnly(role: string) {
  return role === 'sales' || role === 'almacen' || role === 'soporte'
}

export function canRegisterPayments(role: string) {
  return role === 'sales' || role === 'manager' || role === 'admin'
}

export function canConfirmPayments(role: string) {
  return role === 'manager' || role === 'admin'
}

export function canCancelPayments(role: string) {
  return role === 'manager' || role === 'admin'
}

export function canApplyPayments(role: string) {
  return role === 'manager' || role === 'admin'
}

export function canCreateSaleNotes(role: string) {
  return role === 'manager' || role === 'admin'
}

export function canManagePaymentSchedule(role: string) {
  return role === 'manager' || role === 'admin'
}

export function canCancelSale(role: string) {
  return role === 'admin'
}
