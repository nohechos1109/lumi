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
  return role === 'manager' || role === 'admin' || role === 'sales'
}

export function canManagePaymentSchedule(role: string) {
  return role === 'manager' || role === 'admin'
}

export function canCancelSale(role: string) {
  return role === 'admin'
}

export function canMarkSaleAsPaid(role: string) {
  return role === 'manager' || role === 'admin'
}

// ── Servicios ─────────────────────────────────────────────────

export function canAccessServicios(role: string) {
  return role !== 'sales'
}

export function canCreateServiceProject(role: string) {
  return role === 'soporte' || role === 'admin' || role === 'manager'
}

export function canCreateServiceOrder(role: string) {
  return role === 'soporte' || role === 'admin' || role === 'manager'
}

export function canCreateServiceManual(role: string) {
  return role === 'soporte' || role === 'almacen' || role === 'admin' || role === 'manager'
}

export function canCreateServiceRequest(role: string) {
  return role === 'admin' || role === 'manager'
}

export function canApproveServiceRequest(role: string) {
  return role === 'soporte' || role === 'admin'
}

export function canEditService(role: string) {
  return role === 'soporte' || role === 'tecnico' || role === 'admin' || role === 'manager'
}

export function canDeleteServiceEntities(role: string) {
  return role === 'admin'
}

export function canViewOwnServicesOnly(role: string) {
  return role === 'tecnico'
}
