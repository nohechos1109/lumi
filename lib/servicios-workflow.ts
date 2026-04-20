import type { WorkflowStep, StepState } from '@/components/ui/WorkflowStepper'
import type { Service, ServiceOrder, ServiceProject } from '@/lib/queries/servicios'

const WORKFLOW_ORDER = ['pendiente', 'agendado', 'en_curso', 'en_revision'] as const

const ESTATUS_LABEL: Record<string, string> = {
  pendiente:   'Pendiente',
  agendado:    'Agendado',
  en_curso:    'En curso',
  en_revision: 'En revisión',
  terminado:   'Terminado',
  cancelado:   'Cancelado',
  rechazado:   'Rechazado',
}

function estatusSublabel(estatus: string): string {
  return ESTATUS_LABEL[estatus] ?? estatus
}

function isCancelled(estatus: string | null | undefined): boolean {
  return estatus === 'cancelado' || estatus === 'cancelled'
}

/** Steps from Service detail page perspective. */
export function stepsFromService(svc: Service): WorkflowStep[] {
  const servicioCancelled = isCancelled(svc.estatus)
  const servicioTerminado = svc.estatus === 'terminado' || !!svc.approved_at
  const servicioRevision  = svc.estatus === 'en_revision'
  const servicioActive    = (WORKFLOW_ORDER as readonly string[]).includes(svc.estatus) && !servicioTerminado && !servicioRevision
  const hasProject        = !!svc.project_id
  const hasOrder          = !!svc.service_order_id

  const servicioState: StepState = servicioCancelled
    ? 'error'
    : servicioTerminado || servicioRevision
      ? 'done'
      : servicioActive
        ? 'current'
        : 'pending'

  const aprobacionState: StepState = servicioTerminado
    ? 'done'
    : servicioRevision
      ? 'current'
      : 'pending'

  return [
    { key: 'proyecto',   label: 'Planeación',   state: hasProject ? 'done' : 'pending',  href: svc.project_id ? `/servicios/projects/${svc.project_id}` : undefined },
    { key: 'orden',      label: 'Orden',      state: hasOrder ? 'done' : 'pending',     href: svc.service_order_id ? `/servicios/orders/${svc.service_order_id}` : undefined },
    { key: 'servicio',   label: 'Servicio',   state: servicioState, sublabel: estatusSublabel(svc.estatus) },
    { key: 'aprobacion', label: 'Aprobación', state: aprobacionState },
  ]
}

/** Steps from Service Order detail page perspective. */
export function stepsFromOrder(order: ServiceOrder): WorkflowStep[] {
  const orderCancelled = isCancelled(order.estatus)
  const orderTerminado = order.estatus === 'terminado' || order.estatus === 'atendido'
  const orderActive    = ['borrador', 'pendiente', 'agendado', 'en_curso'].includes(order.estatus)

  const ordenState: StepState = orderCancelled
    ? 'error'
    : orderTerminado
      ? 'done'
      : orderActive
        ? 'current'
        : 'pending'

  const servicioState: StepState = orderTerminado ? 'done' : order.estatus === 'en_curso' ? 'current' : 'pending'

  return [
    { key: 'proyecto',   label: 'Planeación',   state: order.service_project_id ? 'done' : 'pending', href: order.service_project_id ? `/servicios/projects/${order.service_project_id}` : undefined },
    { key: 'orden',      label: 'Orden',      state: ordenState, sublabel: estatusSublabel(order.estatus) },
    { key: 'servicio',   label: 'Servicio',   state: servicioState },
    { key: 'aprobacion', label: 'Aprobación', state: 'pending' },
  ]
}

/** Steps from Project detail page perspective. */
export function stepsFromProject(project: ServiceProject): WorkflowStep[] {
  const cancelled = project.status === 'cancelled'
  const completed = project.status === 'completed'
  const active    = project.status === 'open' || project.status === 'in_progress'

  const proyectoState: StepState = cancelled ? 'error' : completed ? 'done' : active ? 'current' : 'pending'

  return [
    { key: 'proyecto',   label: 'Planeación',   state: proyectoState },
    { key: 'orden',      label: 'Orden',      state: 'pending' as const },
    { key: 'servicio',   label: 'Servicio',   state: 'pending' as const },
    { key: 'aprobacion', label: 'Aprobación', state: 'pending' as const },
  ]
}
