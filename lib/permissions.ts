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
