import pool from '@/lib/db'
import type { PoolClient } from 'pg'

// ─── Types ────────────────────────────────────────────────────

export type ServiceProjectStatus = 'open' | 'in_progress' | 'completed' | 'cancelled'
export type ServiceOrderEstatus = 'borrador' | 'pendiente' | 'agendado' | 'en_curso' | 'terminado' | 'atendido' | 'cancelado'
export type ServiceEstatus = 'pendiente' | 'agendado' | 'en_curso' | 'en_revision' | 'terminado' | 'atendido' | 'cancelado' | 'rechazado'
export type ServiceRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface ServiceProject {
  id: string
  number: string
  name: string
  customer_id: string | null
  sale_id: string | null
  created_by: string | null
  status: ServiceProjectStatus
  observaciones: string | null
  created_at: string
  archived_at: string | null
  // joined
  customer_name?: string
  sale_number?: string
  created_by_username?: string
  order_count?: number
  service_count?: number
}

export interface ServiceOrder {
  id: string
  number: string
  service_project_id: string
  estatus: ServiceOrderEstatus
  motivo_del_servicio: string | null
  ubicacion: string | null
  referencias: string | null
  comentarios_de_soporte: string | null
  fecha_hora_agendada: string | null
  fecha_hora_limite: string | null
  fecha_llegada: string | null
  fecha_salida: string | null
  fecha_fin: string | null
  tipo_lugar: 'calle' | 'taller' | null
  assign_all_technicians: boolean
  created_by: string | null
  created_at: string
  archived_at: string | null
  // joined / computed
  project_number?: string
  project_name?: string
  customer_id?: string | null
  customer_name?: string | null
  servicios_pendientes?: number
  servicios_en_curso?: number
  servicios_atendidos?: number
}

export interface Service {
  id: string
  number: string
  service_order_id: string | null
  unidad_id: string | null
  ruta_id: string | null
  customer_id: string | null
  estatus: ServiceEstatus
  motivo_visita: string | null
  referencia: string | null
  ubicacion: string | null
  ubicacion_txt: string | null
  reporte_tecnico: string | null
  comentarios_reporte: string | null
  comentarios_soporte: string | null
  tipo_lugar: 'calle' | 'taller' | null
  assign_all_technicians: boolean
  motivo_cancelacion: string | null
  iniciado_por: string | null
  fecha_creado: string
  fecha_hora_agendada: string | null
  fecha_hora_limite: string | null
  fecha_hora_servicio: string | null
  archived_at: string | null
  approved_by: string | null
  approved_at: string | null
  sale_note_id: string | null
  // joined
  unidad_name?: string
  ruta_name?: string
  customer_name?: string
  iniciado_por_username?: string
  order_number?: string | null
  project_id?: string | null
  project_number?: string | null
  sale_id?: string | null
  technicians?: ServiceTechnician[]
}

export interface ServiceTechnician {
  service_id: string
  user_id: string
  assigned_at: string
  username?: string
}

export interface ServiceRequest {
  id: string
  requested_by: string
  assigned_to: string | null
  customer_id: string | null
  motivo: string
  status: ServiceRequestStatus
  resolved_service_project_id: string | null
  created_at: string
  resolved_at: string | null
  // joined
  requested_by_username?: string
  assigned_to_username?: string
  customer_name?: string | null
  resolved_project_number?: string | null
}

// ─── Number generator ─────────────────────────────────────────

async function generateNumber(prefix: string, table: string, client: PoolClient): Promise<string> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const pattern = `${prefix}-${dateStr}-%`
  const { rows } = await client.query(
    `SELECT number FROM ${table} WHERE number LIKE $1 ORDER BY number DESC LIMIT 1`,
    [pattern]
  )
  let seq = 1
  if (rows.length > 0) {
    const parts = rows[0].number.split('-')
    seq = parseInt(parts[parts.length - 1], 10) + 1
  }
  return `${prefix}-${dateStr}-${String(seq).padStart(4, '0')}`
}

// ─── SELECT fragments ─────────────────────────────────────────

const SP_SELECT = `
  SELECT sp.*,
         c.name AS customer_name,
         s.number AS sale_number,
         u.username AS created_by_username,
         (SELECT COUNT(*)::int FROM service_orders so WHERE so.service_project_id = sp.id) AS order_count,
         (SELECT COUNT(*)::int FROM services srv
            JOIN service_orders so ON so.id = srv.service_order_id
            WHERE so.service_project_id = sp.id) AS service_count
  FROM service_projects sp
  LEFT JOIN contacts c ON c.id = sp.customer_id
  LEFT JOIN sales s ON s.id = sp.sale_id
  LEFT JOIN users u ON u.id = sp.created_by
`

const SO_SELECT = `
  SELECT so.*,
         sp.number AS project_number,
         sp.name   AS project_name,
         sp.customer_id,
         c.name    AS customer_name,
         (SELECT COUNT(*)::int FROM services WHERE service_order_id = so.id AND estatus = 'pendiente') AS servicios_pendientes,
         (SELECT COUNT(*)::int FROM services WHERE service_order_id = so.id AND estatus = 'en_curso')  AS servicios_en_curso,
         (SELECT COUNT(*)::int FROM services WHERE service_order_id = so.id AND estatus = 'atendido') AS servicios_atendidos
  FROM service_orders so
  LEFT JOIN service_projects sp ON sp.id = so.service_project_id
  LEFT JOIN contacts c ON c.id = sp.customer_id
`

const SRV_SELECT = `
  SELECT srv.*,
         uni.name AS unidad_name,
         r.name   AS ruta_name,
         c.name   AS customer_name,
         iu.username AS iniciado_por_username,
         so.number AS order_number,
         sp.id     AS project_id,
         sp.number AS project_number,
         sp.sale_id
  FROM services srv
  LEFT JOIN unidades uni ON uni.id = srv.unidad_id
  LEFT JOIN rutas    r   ON r.id   = srv.ruta_id
  LEFT JOIN contacts c   ON c.id   = srv.customer_id
  LEFT JOIN users    iu  ON iu.id  = srv.iniciado_por
  LEFT JOIN service_orders   so ON so.id = srv.service_order_id
  LEFT JOIN service_projects sp ON sp.id = so.service_project_id
`

const SR_SELECT = `
  SELECT sr.*,
         ru.username AS requested_by_username,
         au.username AS assigned_to_username,
         c.name AS customer_name,
         sp.number AS resolved_project_number
  FROM service_requests sr
  LEFT JOIN users    ru ON ru.id = sr.requested_by
  LEFT JOIN users    au ON au.id = sr.assigned_to
  LEFT JOIN contacts c  ON c.id  = sr.customer_id
  LEFT JOIN service_projects sp ON sp.id = sr.resolved_service_project_id
`

// ─── Service Projects ─────────────────────────────────────────

export async function listServiceProjects(): Promise<ServiceProject[]> {
  const { rows } = await pool.query(`${SP_SELECT} ORDER BY sp.created_at DESC`)
  return rows
}

export async function listServiceProjectsByCreator(userId: string): Promise<ServiceProject[]> {
  const { rows } = await pool.query(
    `${SP_SELECT} WHERE sp.created_by = $1 ORDER BY sp.created_at DESC`,
    [userId]
  )
  return rows
}

export async function getServiceProject(id: string): Promise<ServiceProject | null> {
  const { rows } = await pool.query(`${SP_SELECT} WHERE sp.id = $1`, [id])
  return rows[0] ?? null
}

export interface CreateServiceProjectInput {
  name: string
  customer_id?: string | null
  sale_id?: string | null
  created_by: string
  observaciones?: string | null
}

export async function createServiceProject(data: CreateServiceProjectInput): Promise<ServiceProject> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const number = await generateNumber('SVP', 'service_projects', client)
    const { rows: [sp] } = await client.query(
      `INSERT INTO service_projects (number, name, customer_id, sale_id, created_by, observaciones)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [number, data.name, data.customer_id ?? null, data.sale_id ?? null, data.created_by, data.observaciones ?? null]
    )
    await client.query('COMMIT')
    return sp
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function updateServiceProject(
  id: string,
  data: Partial<Pick<ServiceProject, 'name' | 'customer_id' | 'status' | 'observaciones'>>
): Promise<void> {
  const fields: string[] = []
  const values: unknown[] = []
  let i = 1
  if (data.name !== undefined) { fields.push(`name = $${i++}`); values.push(data.name) }
  if (data.customer_id !== undefined) { fields.push(`customer_id = $${i++}`); values.push(data.customer_id) }
  if (data.status !== undefined) { fields.push(`status = $${i++}`); values.push(data.status) }
  if (data.observaciones !== undefined) { fields.push(`observaciones = $${i++}`); values.push(data.observaciones) }
  if (fields.length === 0) return
  values.push(id)
  await pool.query(`UPDATE service_projects SET ${fields.join(', ')} WHERE id = $${i}`, values)
}

export async function archiveServiceProject(id: string): Promise<void> {
  await pool.query(`UPDATE service_projects SET archived_at = now() WHERE id = $1`, [id])
}

export async function deleteServiceProject(id: string): Promise<void> {
  await pool.query(`DELETE FROM service_projects WHERE id = $1`, [id])
}

// ─── Service Orders ───────────────────────────────────────────

export async function listServiceOrders(): Promise<ServiceOrder[]> {
  const { rows } = await pool.query(
    `${SO_SELECT} WHERE so.archived_at IS NULL ORDER BY so.created_at DESC`
  )
  return rows
}

export async function listServiceOrdersByProject(projectId: string): Promise<ServiceOrder[]> {
  const { rows } = await pool.query(
    `${SO_SELECT} WHERE so.service_project_id = $1 ORDER BY so.created_at DESC`,
    [projectId]
  )
  return rows
}

export async function listServiceOrdersByTechnician(userId: string): Promise<ServiceOrder[]> {
  const { rows } = await pool.query(
    `${SO_SELECT}
     WHERE so.archived_at IS NULL
       AND (
         so.assign_all_technicians = true
         OR EXISTS (SELECT 1 FROM service_order_technicians sot WHERE sot.service_order_id = so.id AND sot.user_id = $1)
         OR EXISTS (
           SELECT 1 FROM services srv
           JOIN service_technicians st ON st.service_id = srv.id
           WHERE srv.service_order_id = so.id AND st.user_id = $1
         )
       )
     ORDER BY so.created_at DESC`,
    [userId]
  )
  return rows
}

export async function isTechnicianOnOrder(orderId: string, userId: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1
     FROM service_orders so
     WHERE so.id = $1
       AND (
         so.assign_all_technicians = true
         OR EXISTS (SELECT 1 FROM service_order_technicians sot WHERE sot.service_order_id = so.id AND sot.user_id = $2)
         OR EXISTS (
           SELECT 1 FROM services srv
           JOIN service_technicians st ON st.service_id = srv.id
           WHERE srv.service_order_id = so.id AND st.user_id = $2
         )
       )
     LIMIT 1`,
    [orderId, userId]
  )
  return rows.length > 0
}

export async function getServiceOrder(id: string): Promise<ServiceOrder | null> {
  const { rows } = await pool.query(`${SO_SELECT} WHERE so.id = $1`, [id])
  return rows[0] ?? null
}

export interface CreateServiceOrderInput {
  service_project_id: string
  motivo_del_servicio?: string | null
  ubicacion?: string | null
  referencias?: string | null
  comentarios_de_soporte?: string | null
  tipo_lugar?: 'calle' | 'taller' | null
  technician_ids?: string[]
  assign_all_technicians?: boolean
  fecha_hora_agendada?: string | null
  fecha_hora_limite?: string | null
  created_by: string
}

export async function createServiceOrder(data: CreateServiceOrderInput): Promise<ServiceOrder> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const number = await generateNumber('OSV', 'service_orders', client)
    const { rows: [so] } = await client.query(
      `INSERT INTO service_orders
         (number, service_project_id, motivo_del_servicio, ubicacion, referencias,
          comentarios_de_soporte, tipo_lugar,
          fecha_hora_agendada, fecha_hora_limite, created_by, assign_all_technicians)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        number, data.service_project_id,
        data.motivo_del_servicio ?? null, data.ubicacion ?? null, data.referencias ?? null,
        data.comentarios_de_soporte ?? null,
        data.tipo_lugar ?? null,
        data.fecha_hora_agendada ?? null, data.fecha_hora_limite ?? null, data.created_by,
        data.assign_all_technicians ?? false,
      ]
    )

    // Assign technicians to order
    if (data.technician_ids && data.technician_ids.length > 0) {
      const vals = data.technician_ids.map((_, i) => `($1, $${i + 2})`).join(', ')
      await client.query(
        `INSERT INTO service_order_technicians (service_order_id, user_id) VALUES ${vals} ON CONFLICT DO NOTHING`,
        [so.id, ...data.technician_ids]
      )
    }

    await client.query('COMMIT')
    return so
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

type UpdatableOrderFields = Partial<Pick<ServiceOrder,
  'estatus' | 'motivo_del_servicio' | 'ubicacion' | 'referencias' |
  'comentarios_de_soporte' | 'tipo_lugar' | 'fecha_hora_agendada' | 'fecha_hora_limite' |
  'fecha_llegada' | 'fecha_salida' | 'fecha_fin' | 'assign_all_technicians'>>

export async function updateServiceOrder(id: string, data: UpdatableOrderFields): Promise<void> {
  const fields: string[] = []
  const values: unknown[] = []
  let i = 1
  const setField = (col: string, val: unknown) => { fields.push(`${col} = $${i++}`); values.push(val) }
  if (data.estatus !== undefined) setField('estatus', data.estatus)
  if (data.motivo_del_servicio !== undefined) setField('motivo_del_servicio', data.motivo_del_servicio)
  if (data.ubicacion !== undefined) setField('ubicacion', data.ubicacion)
  if (data.referencias !== undefined) setField('referencias', data.referencias)
  if (data.comentarios_de_soporte !== undefined) setField('comentarios_de_soporte', data.comentarios_de_soporte)
  if (data.tipo_lugar !== undefined) setField('tipo_lugar', data.tipo_lugar)
  if (data.fecha_hora_agendada !== undefined) setField('fecha_hora_agendada', data.fecha_hora_agendada)
  if (data.fecha_hora_limite !== undefined) setField('fecha_hora_limite', data.fecha_hora_limite)
  if (data.fecha_llegada !== undefined) setField('fecha_llegada', data.fecha_llegada)
  if (data.fecha_salida !== undefined) setField('fecha_salida', data.fecha_salida)
  if (data.fecha_fin !== undefined) setField('fecha_fin', data.fecha_fin)
  if (data.assign_all_technicians !== undefined) setField('assign_all_technicians', data.assign_all_technicians)
  if (fields.length === 0) return
  values.push(id)
  await pool.query(`UPDATE service_orders SET ${fields.join(', ')} WHERE id = $${i}`, values)
}

export async function archiveServiceOrder(id: string): Promise<void> {
  await pool.query(`UPDATE service_orders SET archived_at = now() WHERE id = $1`, [id])
}

export async function deleteServiceOrder(id: string): Promise<void> {
  await pool.query(`DELETE FROM service_orders WHERE id = $1`, [id])
}

// ─── Services ─────────────────────────────────────────────────

export async function listServices(): Promise<Service[]> {
  const { rows } = await pool.query(`${SRV_SELECT} ORDER BY srv.fecha_creado DESC`)
  return rows
}

export async function listServicesByOrder(orderId: string): Promise<Service[]> {
  const { rows } = await pool.query(
    `${SRV_SELECT} WHERE srv.service_order_id = $1 ORDER BY srv.fecha_creado DESC`,
    [orderId]
  )
  return rows
}

export async function listWalkInServices(): Promise<Service[]> {
  const { rows } = await pool.query(
    `${SRV_SELECT} WHERE srv.service_order_id IS NULL ORDER BY srv.fecha_creado DESC`
  )
  return rows
}

export async function listServicesByTechnician(userId: string): Promise<Service[]> {
  const { rows } = await pool.query(
    `${SRV_SELECT}
     WHERE (
       COALESCE(so.assign_all_technicians, srv.assign_all_technicians) = true
       OR EXISTS (SELECT 1 FROM service_technicians st WHERE st.service_id = srv.id AND st.user_id = $1)
       OR EXISTS (SELECT 1 FROM service_order_technicians sot WHERE sot.service_order_id = srv.service_order_id AND sot.user_id = $1)
     )
     ORDER BY srv.fecha_creado DESC`,
    [userId]
  )
  return rows
}

export async function listServicesByCreator(userId: string): Promise<Service[]> {
  const { rows } = await pool.query(
    `${SRV_SELECT} WHERE srv.iniciado_por = $1 ORDER BY srv.fecha_creado DESC`,
    [userId]
  )
  return rows
}

export async function getService(id: string): Promise<Service | null> {
  const { rows } = await pool.query(`${SRV_SELECT} WHERE srv.id = $1`, [id])
  if (!rows[0]) return null
  const srv = rows[0]
  if (srv.service_order_id) {
    const { rows: [orderRow] } = await pool.query(
      `SELECT assign_all_technicians FROM service_orders WHERE id = $1`,
      [srv.service_order_id]
    )
    srv.assign_all_technicians = orderRow?.assign_all_technicians ?? false
    const { rows: tecRows } = await pool.query(
      `SELECT sot.user_id, u.username, sot.assigned_at
       FROM service_order_technicians sot
       JOIN users u ON u.id = sot.user_id
       WHERE sot.service_order_id = $1
       ORDER BY sot.assigned_at`,
      [srv.service_order_id]
    )
    srv.technicians = tecRows.map((r: { user_id: string; username: string; assigned_at: string }) => ({
      service_id: id,
      user_id: r.user_id,
      username: r.username,
      assigned_at: r.assigned_at,
    }))
  } else {
    srv.technicians = await listServiceTechnicians(id)
  }
  return srv
}

export interface CreateServiceInput {
  service_order_id?: string | null
  unidad_id?: string | null
  ruta_id?: string | null
  customer_id?: string | null
  motivo_visita?: string | null
  referencia?: string | null
  ubicacion?: string | null
  ubicacion_txt?: string | null
  tipo_lugar?: 'calle' | 'taller' | null
  comentarios_soporte?: string | null
  fecha_hora_agendada?: string | null
  fecha_hora_limite?: string | null
  assign_all_technicians?: boolean
  iniciado_por: string
}

export async function createService(data: CreateServiceInput, client?: PoolClient): Promise<Service> {
  const useOwnClient = !client
  const c = client ?? await pool.connect()
  try {
    if (useOwnClient) await c.query('BEGIN')
    const number = await generateNumber('SRV', 'services', c)
    const { rows: [srv] } = await c.query(
      `INSERT INTO services
         (number, service_order_id, unidad_id, ruta_id, customer_id,
          motivo_visita, referencia, ubicacion, ubicacion_txt, tipo_lugar,
          comentarios_soporte, fecha_hora_agendada, fecha_hora_limite, iniciado_por,
          assign_all_technicians)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        number, data.service_order_id ?? null, data.unidad_id ?? null, data.ruta_id ?? null,
        data.customer_id ?? null, data.motivo_visita ?? null, data.referencia ?? null,
        data.ubicacion ?? null, data.ubicacion_txt ?? null, data.tipo_lugar ?? null,
        data.comentarios_soporte ?? null,
        data.fecha_hora_agendada ?? null, data.fecha_hora_limite ?? null, data.iniciado_por,
        data.assign_all_technicians ?? false,
      ]
    )
    if (useOwnClient) await c.query('COMMIT')
    return srv
  } catch (err) {
    if (useOwnClient) await c.query('ROLLBACK')
    throw err
  } finally {
    if (useOwnClient) c.release()
  }
}

type UpdatableServiceFields = Partial<Pick<Service,
  'service_order_id' | 'unidad_id' | 'ruta_id' | 'customer_id' | 'estatus' |
  'motivo_visita' | 'referencia' | 'ubicacion' | 'ubicacion_txt' |
  'reporte_tecnico' | 'comentarios_reporte' | 'comentarios_soporte' | 'motivo_cancelacion' |
  'fecha_hora_agendada' | 'fecha_hora_limite' | 'fecha_hora_servicio' | 'assign_all_technicians'>>

export async function updateService(id: string, data: UpdatableServiceFields): Promise<void> {
  const fields: string[] = []
  const values: unknown[] = []
  let i = 1
  const setField = (col: string, val: unknown) => { fields.push(`${col} = $${i++}`); values.push(val) }
  if (data.service_order_id !== undefined) setField('service_order_id', data.service_order_id)
  if (data.unidad_id !== undefined) setField('unidad_id', data.unidad_id)
  if (data.ruta_id !== undefined) setField('ruta_id', data.ruta_id)
  if (data.customer_id !== undefined) setField('customer_id', data.customer_id)
  if (data.estatus !== undefined) setField('estatus', data.estatus)
  if (data.motivo_visita !== undefined) setField('motivo_visita', data.motivo_visita)
  if (data.referencia !== undefined) setField('referencia', data.referencia)
  if (data.ubicacion !== undefined) setField('ubicacion', data.ubicacion)
  if (data.ubicacion_txt !== undefined) setField('ubicacion_txt', data.ubicacion_txt)
  if (data.reporte_tecnico !== undefined) setField('reporte_tecnico', data.reporte_tecnico)
  if (data.comentarios_reporte !== undefined) setField('comentarios_reporte', data.comentarios_reporte)
  if (data.comentarios_soporte !== undefined) setField('comentarios_soporte', data.comentarios_soporte)
  if (data.motivo_cancelacion !== undefined) setField('motivo_cancelacion', data.motivo_cancelacion)
  if (data.fecha_hora_agendada !== undefined) setField('fecha_hora_agendada', data.fecha_hora_agendada)
  if (data.fecha_hora_limite !== undefined) setField('fecha_hora_limite', data.fecha_hora_limite)
  if (data.fecha_hora_servicio !== undefined) setField('fecha_hora_servicio', data.fecha_hora_servicio)
  if (data.assign_all_technicians !== undefined) setField('assign_all_technicians', data.assign_all_technicians)
  if (fields.length === 0) return
  values.push(id)
  await pool.query(`UPDATE services SET ${fields.join(', ')} WHERE id = $${i}`, values)
}

export async function deleteService(id: string): Promise<void> {
  await pool.query(`DELETE FROM services WHERE id = $1`, [id])
}

// ─── Promote walk-in → project + order ──────────────────────

export async function promoteWalkInService(
  serviceId: string,
  userId: string,
  projectName?: string,
  observaciones?: string | null,
): Promise<{ projectId: string; orderId: string }> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Lock service, verify walk-in
    const { rows: [srv] } = await client.query(
      `SELECT * FROM services WHERE id = $1 FOR UPDATE`,
      [serviceId]
    )
    if (!srv) throw new Error('NOT_FOUND')
    if (srv.service_order_id) throw new Error('ALREADY_HAS_ORDER')

    // Create project
    const projNumber = await generateNumber('SVP', 'service_projects', client)
    const projName = projectName || srv.motivo_visita || `Seguimiento ${srv.number}`
    const { rows: [proj] } = await client.query(
      `INSERT INTO service_projects (number, name, customer_id, created_by, status, observaciones)
       VALUES ($1, $2, $3, $4, 'open', $5)
       RETURNING id`,
      [projNumber, projName, srv.customer_id, userId, observaciones ?? null]
    )

    // Create order
    const orderNumber = await generateNumber('OSV', 'service_orders', client)
    const { rows: [order] } = await client.query(
      `INSERT INTO service_orders (number, service_project_id, estatus, motivo_del_servicio, tipo_lugar, created_by, assign_all_technicians)
       VALUES ($1, $2, 'pendiente', $3, $4, $5, $6)
       RETURNING id`,
      [orderNumber, proj.id, srv.motivo_visita, srv.tipo_lugar, userId, srv.assign_all_technicians ?? false]
    )

    // Link service to order
    await client.query(
      `UPDATE services SET service_order_id = $1 WHERE id = $2`,
      [order.id, serviceId]
    )

    // Copy orphan service technicians → order technicians
    await client.query(
      `INSERT INTO service_order_technicians (service_order_id, user_id)
       SELECT $1, user_id FROM service_technicians WHERE service_id = $2
       ON CONFLICT DO NOTHING`,
      [order.id, serviceId]
    )

    await client.query('COMMIT')
    return { projectId: proj.id, orderId: order.id }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ─── Order Technicians ───────────────────────────────────────

export async function listOrderTechnicians(orderId: string): Promise<Array<{ user_id: string; username: string; assigned_at: string }>> {
  const { rows } = await pool.query(
    `SELECT sot.user_id, u.username, sot.assigned_at
     FROM service_order_technicians sot
     JOIN users u ON u.id = sot.user_id
     WHERE sot.service_order_id = $1
     ORDER BY sot.assigned_at`,
    [orderId]
  )
  return rows
}

export async function assignOrderTechnicians(orderId: string, userIds: string[]): Promise<void> {
  if (userIds.length === 0) return
  const values = userIds.map((_, i) => `($1, $${i + 2})`).join(', ')
  await pool.query(
    `INSERT INTO service_order_technicians (service_order_id, user_id) VALUES ${values}
     ON CONFLICT DO NOTHING`,
    [orderId, ...userIds]
  )
}

export async function removeOrderTechnician(orderId: string, userId: string): Promise<void> {
  await pool.query(
    `DELETE FROM service_order_technicians WHERE service_order_id = $1 AND user_id = $2`,
    [orderId, userId]
  )
}

// ─── Service Technicians ──────────────────────────────────────

export async function listServiceTechnicians(serviceId: string): Promise<ServiceTechnician[]> {
  const { rows } = await pool.query(
    `SELECT st.*, u.username
     FROM service_technicians st
     JOIN users u ON u.id = st.user_id
     WHERE st.service_id = $1
     ORDER BY st.assigned_at`,
    [serviceId]
  )
  return rows
}

export async function assignTechnician(serviceId: string, userId: string): Promise<void> {
  await pool.query(
    `INSERT INTO service_technicians (service_id, user_id) VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [serviceId, userId]
  )
}

export async function removeTechnician(serviceId: string, userId: string): Promise<void> {
  await pool.query(
    `DELETE FROM service_technicians WHERE service_id = $1 AND user_id = $2`,
    [serviceId, userId]
  )
}

export async function listTechnicianUsers(): Promise<Array<{ id: string; username: string }>> {
  const { rows } = await pool.query(
    `SELECT id, username FROM users WHERE role = 'tecnico' ORDER BY username`
  )
  return rows
}

export async function listUsersByRoles(roles: string[]): Promise<Array<{ id: string; username: string; role: string }>> {
  if (roles.length === 0) return []
  const { rows } = await pool.query(
    `SELECT id, username, role FROM users WHERE role = ANY($1::text[]) ORDER BY username`,
    [roles]
  )
  return rows
}

// ─── Service Requests ─────────────────────────────────────────

export async function listServiceRequests(): Promise<ServiceRequest[]> {
  const { rows } = await pool.query(`${SR_SELECT} ORDER BY sr.created_at DESC`)
  return rows
}

export async function listServiceRequestsByAssignee(userId: string): Promise<ServiceRequest[]> {
  const { rows } = await pool.query(
    `${SR_SELECT} WHERE sr.assigned_to = $1 ORDER BY sr.created_at DESC`,
    [userId]
  )
  return rows
}

export async function listServiceRequestsByRequester(userId: string): Promise<ServiceRequest[]> {
  const { rows } = await pool.query(
    `${SR_SELECT} WHERE sr.requested_by = $1 ORDER BY sr.created_at DESC`,
    [userId]
  )
  return rows
}

export async function getServiceRequest(id: string): Promise<ServiceRequest | null> {
  const { rows } = await pool.query(`${SR_SELECT} WHERE sr.id = $1`, [id])
  return rows[0] ?? null
}

export interface CreateServiceRequestInput {
  requested_by: string
  assigned_to?: string | null
  customer_id?: string | null
  motivo: string
}

export async function createServiceRequest(data: CreateServiceRequestInput): Promise<ServiceRequest> {
  const { rows: [sr] } = await pool.query(
    `INSERT INTO service_requests (requested_by, assigned_to, customer_id, motivo)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.requested_by, data.assigned_to ?? null, data.customer_id ?? null, data.motivo]
  )
  return sr
}

/** Approve a pending request. Creates a new service_project in the same transaction. */
export async function approveServiceRequest(
  id: string,
  approverId: string
): Promise<{ request: ServiceRequest; project: ServiceProject }> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows: [req] } = await client.query(
      `SELECT * FROM service_requests WHERE id = $1 FOR UPDATE`,
      [id]
    )
    if (!req) throw new Error('NOT_FOUND')
    if (req.status !== 'pending') throw new Error('INVALID_STATE')

    const spNumber = await generateNumber('SVP', 'service_projects', client)
    const { rows: [project] } = await client.query(
      `INSERT INTO service_projects (number, name, customer_id, created_by, observaciones)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [spNumber, req.motivo, req.customer_id, approverId, `Creado desde solicitud ${id}`]
    )

    const { rows: [updated] } = await client.query(
      `UPDATE service_requests
       SET status = 'approved',
           resolved_service_project_id = $1,
           resolved_at = now()
       WHERE id = $2
       RETURNING *`,
      [project.id, id]
    )

    await client.query('COMMIT')
    return { request: updated, project }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function rejectServiceRequest(id: string): Promise<ServiceRequest> {
  const { rows: [sr] } = await pool.query(
    `UPDATE service_requests
     SET status = 'rejected', resolved_at = now()
     WHERE id = $1 AND status = 'pending'
     RETURNING *`,
    [id]
  )
  if (!sr) throw new Error('INVALID_STATE')
  return sr
}

// ─── Auto-creation from confirmed quote ───────────────────────

/**
 * After a sale is created from a confirmed quote, scan the originating quote
 * for lines whose product is flagged as `is_service`. If any are found,
 * create a service_project linked to the sale. No orders or services are created.
 *
 * Intentionally swallows errors via try/catch at the caller — never block sale creation.
 */
export async function autoCreateServiceProjectFromSale(
  saleId: string,
  userId: string
): Promise<ServiceProject | null> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows: [sale] } = await client.query(
      `SELECT s.id, s.number, s.customer_id, s.quote_id, q.number AS quote_number
       FROM sales s
       JOIN quotes q ON q.id = s.quote_id
       WHERE s.id = $1`,
      [saleId]
    )
    if (!sale) {
      await client.query('ROLLBACK')
      return null
    }

    const { rows: serviceLines } = await client.query(
      `SELECT p.name
       FROM quote_lines ql
       JOIN products p ON p.id = ql.product_id
       WHERE ql.quote_id = $1 AND p.is_service = true AND ql.display_type = 'product'
       ORDER BY ql.sequence`,
      [sale.quote_id]
    )
    if (serviceLines.length === 0) {
      await client.query('ROLLBACK')
      return null
    }

    const motivoTexto = serviceLines.map((r: { name: string }) => r.name).join(', ')

    const spNumber = await generateNumber('SVP', 'service_projects', client)
    const { rows: [project] } = await client.query(
      `INSERT INTO service_projects (number, name, customer_id, sale_id, created_by, observaciones)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        spNumber,
        `Servicios ${sale.quote_number}`,
        sale.customer_id,
        sale.id,
        userId,
        `Auto-generado desde venta ${sale.number}`,
      ]
    )

    // Create service_order linked to the project
    const orderNumber = await generateNumber('OSV', 'service_orders', client)
    const { rows: [order] } = await client.query(
      `INSERT INTO service_orders
         (number, service_project_id, estatus, motivo_del_servicio, created_by, assign_all_technicians)
       VALUES ($1, $2, 'pendiente', $3, $4, false)
       RETURNING id`,
      [orderNumber, project.id, motivoTexto, userId]
    )

    // Create service linked to the order
    const srvNumber = await generateNumber('SRV', 'services', client)
    await client.query(
      `INSERT INTO services
         (number, service_order_id, customer_id, estatus, motivo_visita, iniciado_por, assign_all_technicians)
       VALUES ($1, $2, $3, 'pendiente', $4, $5, false)`,
      [srvNumber, order.id, sale.customer_id, motivoTexto, userId]
    )

    await client.query('COMMIT')
    return project
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ─── Service Materials ───────────────────────────────────────

export interface ServiceMaterial {
  id: string
  service_id: string
  product_id: string
  quote_line_id: string | null
  quantity: string
  unit_price: string
  notes: string | null
  created_by: string | null
  created_at: string
  // joined
  product_name?: string
  product_sku?: string | null
  created_by_username?: string
}

export async function listServiceMaterials(serviceId: string): Promise<ServiceMaterial[]> {
  const { rows } = await pool.query(
    `SELECT sm.*, p.name AS product_name, p.sku AS product_sku, u.username AS created_by_username
     FROM service_materials sm
     LEFT JOIN products p ON p.id = sm.product_id
     LEFT JOIN users u ON u.id = sm.created_by
     WHERE sm.service_id = $1
     ORDER BY sm.created_at DESC`,
    [serviceId]
  )
  return rows
}

export interface CreateServiceMaterialInput {
  service_id: string
  product_id: string
  quantity: number
  unit_price: number
  notes?: string | null
  created_by: string
  quote_line_id?: string | null
}

export async function createServiceMaterial(data: CreateServiceMaterialInput): Promise<ServiceMaterial> {
  const { rows: [m] } = await pool.query(
    `INSERT INTO service_materials (service_id, product_id, quantity, unit_price, notes, created_by, quote_line_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [data.service_id, data.product_id, data.quantity, data.unit_price, data.notes ?? null, data.created_by, data.quote_line_id ?? null]
  )
  return m
}

export async function updateServiceMaterial(
  id: string,
  data: { quantity?: number; unit_price?: number; notes?: string | null }
): Promise<void> {
  const fields: string[] = []
  const values: unknown[] = []
  let i = 1
  if (data.quantity !== undefined) { fields.push(`quantity = $${i++}`); values.push(data.quantity) }
  if (data.unit_price !== undefined) { fields.push(`unit_price = $${i++}`); values.push(data.unit_price) }
  if (data.notes !== undefined) { fields.push(`notes = $${i++}`); values.push(data.notes) }
  if (fields.length === 0) return
  values.push(id)
  await pool.query(`UPDATE service_materials SET ${fields.join(', ')} WHERE id = $${i}`, values)
}

export async function deleteServiceMaterial(id: string): Promise<void> {
  await pool.query(`DELETE FROM service_materials WHERE id = $1`, [id])
}

export async function deleteAllServiceMaterials(serviceId: string): Promise<void> {
  await pool.query(`DELETE FROM service_materials WHERE service_id = $1`, [serviceId])
}

export async function getServiceMaterialsTotal(serviceId: string): Promise<number> {
  const { rows: [{ total }] } = await pool.query(
    `SELECT COALESCE(SUM(quantity * unit_price), 0)::numeric AS total
     FROM service_materials WHERE service_id = $1`,
    [serviceId]
  )
  return Number(total)
}

// ─── Service Approval (Fase 3) ───────────────────────────────

const TAX_RATE = 0.16

export interface ApproveServiceResult {
  service: Service
  saleNote: { id: string; number: string; sale_id: string }
  sale: { id: string; number: string }
}

/**
 * Approve a service that has status 'atendido' + materials.
 * Creates a sale_note (and sale if needed) from the service materials.
 *
 * Flow:
 * 1. Validate service is atendido + has materials
 * 2. Find linked sale via order → project → sale_id (or create new sale)
 * 3. Create sale_note with materials as lines
 * 4. Update service: approved_by, approved_at, sale_note_id
 */
export async function approveService(
  serviceId: string,
  approverId: string
): Promise<ApproveServiceResult> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Lock + validate service
    const { rows: [srv] } = await client.query(
      `SELECT s.*, so.service_project_id
       FROM services s
       LEFT JOIN service_orders so ON so.id = s.service_order_id
       WHERE s.id = $1 FOR UPDATE OF s`,
      [serviceId]
    )
    if (!srv) throw new Error('NOT_FOUND')
    if (srv.estatus !== 'en_revision') throw new Error('INVALID_STATE')
    if (srv.approved_at) throw new Error('ALREADY_APPROVED')

    // 2. Get materials
    const { rows: materials } = await client.query(
      `SELECT sm.*, p.name AS product_name
       FROM service_materials sm
       JOIN products p ON p.id = sm.product_id
       WHERE sm.service_id = $1
       ORDER BY sm.created_at, sm.id`,
      [serviceId]
    )
    if (materials.length === 0) throw new Error('NO_MATERIALS')

    // 3. Find or create sale
    let saleId: string
    let saleNumber: string

    if (srv.service_project_id) {
      const { rows: [proj] } = await client.query(
        `SELECT sale_id FROM service_projects WHERE id = $1`,
        [srv.service_project_id]
      )
      if (proj?.sale_id) {
        saleId = proj.sale_id
        const { rows: [s] } = await client.query(`SELECT number FROM sales WHERE id = $1`, [saleId])
        saleNumber = s.number
      } else {
        // Create sale for project without quote
        const result = await createServiceSale(client, srv.customer_id, approverId)
        saleId = result.id
        saleNumber = result.number
        // Link sale to project
        if (srv.service_project_id) {
          await client.query(
            `UPDATE service_projects SET sale_id = $1 WHERE id = $2 AND sale_id IS NULL`,
            [saleId, srv.service_project_id]
          )
        }
      }
    } else {
      // Walk-in — create sale
      const result = await createServiceSale(client, srv.customer_id, approverId)
      saleId = result.id
      saleNumber = result.number
    }

    // 4. Build note lines + totals
    let amountUntaxed = 0
    const noteLines: Array<{
      product_id: string; quote_line_id: string | null; name: string; qty: number;
      unit_price_mxn: number; subtotal: number; tax_amount: number; total: number;
    }> = []

    for (const m of materials) {
      const qty = Number(m.quantity)
      const price = Number(m.unit_price)
      const subtotal = qty * price
      const tax = subtotal * TAX_RATE
      amountUntaxed += subtotal
      noteLines.push({
        product_id: m.product_id,
        quote_line_id: m.quote_line_id ?? null,
        name: m.product_name,
        qty,
        unit_price_mxn: price,
        subtotal,
        tax_amount: Math.round(tax * 100) / 100,
        total: Math.round((subtotal + tax) * 100) / 100,
      })
    }

    const amountTax = Math.round(amountUntaxed * TAX_RATE * 100) / 100
    const amountTotal = Math.round((amountUntaxed + amountTax) * 100) / 100

    // 5. Generate NTA number + insert note
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const { rows: lastNta } = await client.query(
      `SELECT number FROM sale_notes WHERE number LIKE $1 ORDER BY number DESC LIMIT 1`,
      [`NTA-${dateStr}-%`]
    )
    let ntaSeq = 1
    if (lastNta.length > 0) {
      ntaSeq = parseInt(lastNta[0].number.split('-').pop()!, 10) + 1
    }
    const ntaNumber = `NTA-${dateStr}-${String(ntaSeq).padStart(4, '0')}`

    const { rows: [note] } = await client.query(
      `INSERT INTO sale_notes
         (number, sale_id, service_id, unit_id, state, concept,
          amount_untaxed, amount_tax, amount_total, amount_balance,
          observaciones)
       VALUES ($1, $2, $3, $4, 'draft', $5, $6, $7, $8, $8, $9)
       RETURNING id, number, sale_id`,
      [
        ntaNumber, saleId, serviceId, srv.unidad_id ?? null,
        `Materiales servicio ${srv.number}`,
        amountUntaxed, amountTax, amountTotal,
        `Generada automáticamente desde servicio ${srv.number}`,
      ]
    )

    // 6. Insert note lines
    for (let i = 0; i < noteLines.length; i++) {
      const ln = noteLines[i]
      await client.query(
        `INSERT INTO sale_note_lines
           (sale_note_id, sequence, display_type, product_id, quote_line_id, name, qty,
            unit_price_mxn, subtotal, tax_amount, total)
         VALUES ($1, $2, 'product', $3, $4, $5, $6, $7, $8, $9, $10)`,
        [note.id, i + 1, ln.product_id, ln.quote_line_id, ln.name, ln.qty,
         ln.unit_price_mxn, ln.subtotal, ln.tax_amount, ln.total]
      )
    }

    // 7. Update service
    await client.query(
      `UPDATE services
       SET approved_by = $1, approved_at = now(), sale_note_id = $2, estatus = 'terminado'
       WHERE id = $3`,
      [approverId, note.id, serviceId]
    )

    // 8. Update sale totals
    await client.query(`
      UPDATE sales
      SET amount_untaxed = COALESCE((SELECT SUM(sn.amount_untaxed) FROM sale_notes sn WHERE sn.sale_id = sales.id AND sn.state != 'cancelled'), 0),
          amount_tax = COALESCE((SELECT SUM(sn.amount_tax) FROM sale_notes sn WHERE sn.sale_id = sales.id AND sn.state != 'cancelled'), 0),
          amount_total = COALESCE((SELECT SUM(sn.amount_total) FROM sale_notes sn WHERE sn.sale_id = sales.id AND sn.state != 'cancelled'), 0),
          amount_balance = COALESCE((SELECT SUM(sn.amount_balance) FROM sale_notes sn WHERE sn.sale_id = sales.id AND sn.state != 'cancelled'), 0)
      WHERE id = $1
    `, [saleId])

    await client.query('COMMIT')

    // Re-fetch service
    const updated = await getService(serviceId)

    return {
      service: updated!,
      saleNote: note,
      sale: { id: saleId, number: saleNumber },
    }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

/** Create a minimal sale for service-only billing (no quote required). */
async function createServiceSale(
  client: import('pg').PoolClient,
  customerId: string | null,
  userId: string
): Promise<{ id: string; number: string }> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const { rows: lastVta } = await client.query(
    `SELECT number FROM sales WHERE number LIKE $1 ORDER BY number DESC LIMIT 1`,
    [`VTA-${dateStr}-%`]
  )
  let seq = 1
  if (lastVta.length > 0) {
    seq = parseInt(lastVta[0].number.split('-').pop()!, 10) + 1
  }
  const vtaNumber = `VTA-${dateStr}-${String(seq).padStart(4, '0')}`

  const { rows: [sale] } = await client.query(
    `INSERT INTO sales
       (number, quote_id, customer_id, user_id,
        amount_untaxed, amount_tax, amount_total, amount_balance, unit_count)
     VALUES ($1, NULL, $2, $3, 0, 0, 0, 0, 1)
     RETURNING id, number`,
    [vtaNumber, customerId, userId]
  )
  return sale
}
