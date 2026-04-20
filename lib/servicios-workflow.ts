import type { WorkflowStep, StepState } from '@/components/ui/WorkflowStepper'
import type { Service, ServiceOrder, ServiceProject } from '@/lib/queries/servicios'

const WORKFLOW_ORDER = ['pendiente', 'agendado', 'en_curso', 'atendido'] as const

const ESTATUS_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  agendado:  'Agendado',
  en_curso:  'En curso',
  atendido:  'Atendido',
  cancelado: 'Cancelado',
  rechazado: 'Rechazado',
}

function estatusSublabel(estatus: string): string {
  return ESTATUS_LABEL[estatus] ?? estatus
}

function isCancelled(estatus: string | null | undefined): boolean {
  return estatus === 'cancelado' || estatus === 'cancelled' || estatus === 'rechazado'
}

/** Steps from Service detail page perspective. */
export function stepsFromService(svc: Service, hasMaterials: boolean, hasSaleNote: boolean): WorkflowStep[] {
  const servicioCancelled = isCancelled(svc.estatus)
  const servicioAtendido  = svc.estatus === 'atendido'
  const servicioActive    = (WORKFLOW_ORDER as readonly string[]).includes(svc.estatus) && !servicioAtendido
  const approved          = !!svc.approved_at
  const hasProject        = !!svc.project_id
  const hasOrder          = !!svc.service_order_id

  const servicioState: StepState = servicioCancelled
    ? 'error'
    : servicioAtendido
      ? 'done'
      : servicioActive
        ? 'current'
        : 'pending'

  let materialesState: StepState = 'pending'
  if (hasMaterials) materialesState = approved || hasSaleNote ? 'done' : servicioAtendido ? 'current' : 'done'
  else if (servicioAtendido && !approved) materialesState = 'current'

  const aprobacionState: StepState = approved
    ? 'done'
    : servicioAtendido && hasMaterials
      ? 'current'
      : 'pending'

  const ventaState: StepState = hasSaleNote ? 'done' : approved ? 'current' : 'pending'

  return [
    { key: 'proyecto',   label: 'Proyecto',   state: hasProject ? 'done' : 'pending' },
    { key: 'orden',      label: 'Orden',      state: hasOrder ? 'done' : 'pending' },
    { key: 'servicio',   label: 'Servicio',   state: servicioState, sublabel: estatusSublabel(svc.estatus) },
    { key: 'materiales', label: 'Materiales', state: materialesState },
    { key: 'aprobacion', label: 'Aprobación', state: aprobacionState },
    { key: 'venta',      label: 'Nota venta', state: ventaState },
  ]
}

/** Steps from Service Order detail page perspective. */
export function stepsFromOrder(order: ServiceOrder): WorkflowStep[] {
  const orderCancelled = isCancelled(order.estatus)
  const orderAtendido  = order.estatus === 'atendido'
  const orderActive    = (WORKFLOW_ORDER as readonly string[]).includes(order.estatus) && !orderAtendido

  const ordenState: StepState = orderCancelled
    ? 'error'
    : orderAtendido
      ? 'done'
      : orderActive
        ? 'current'
        : 'pending'

  const servicioState: StepState = orderAtendido ? 'done' : orderActive ? 'current' : 'pending'

  return [
    { key: 'proyecto',   label: 'Proyecto',   state: order.service_project_id ? 'done' : 'pending' },
    { key: 'orden',      label: 'Orden',      state: ordenState, sublabel: estatusSublabel(order.estatus) },
    { key: 'servicio',   label: 'Servicio',   state: servicioState },
    { key: 'materiales', label: 'Materiales', state: 'pending' },
    { key: 'aprobacion', label: 'Aprobación', state: 'pending' },
    { key: 'venta',      label: 'Nota venta', state: 'pending' },
  ]
}

/** Steps from Project detail page perspective. */
export function stepsFromProject(project: ServiceProject, hasOrders: boolean, hasSale: boolean): WorkflowStep[] {
  const cancelled = project.status === 'cancelled'
  const completed = project.status === 'completed'
  const active    = project.status === 'open' || project.status === 'in_progress'

  const proyectoState: StepState = cancelled ? 'error' : completed ? 'done' : active ? 'current' : 'pending'

  return [
    { key: 'proyecto',   label: 'Proyecto',   state: proyectoState },
    { key: 'orden',      label: 'Orden',      state: hasOrders ? 'current' : 'pending' },
    { key: 'servicio',   label: 'Servicio',   state: 'pending' },
    { key: 'materiales', label: 'Materiales', state: 'pending' },
    { key: 'aprobacion', label: 'Aprobación', state: 'pending' },
    { key: 'venta',      label: 'Nota venta', state: hasSale ? 'done' : 'pending' },
  ]
}
