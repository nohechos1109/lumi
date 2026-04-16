import pool from '@/lib/db'
import type { PoolClient } from 'pg'

// ─── Types ────────────────────────────────────────────────────

export type ServiceProjectStatus = 'open' | 'in_progress' | 'completed' | 'cancelled'
export type ServiceOrderEstatus = 'pendiente' | 'agendado' | 'en_curso' | 'atendido' | 'cancelado'
export type ServiceEstatus = 'pendiente' | 'agendado' | 'en_curso' | 'atendido' | 'cancelado' | 'rechazado'
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
  foja_de_ruta: string | null
  comentarios_de_soporte: string | null
  encargados: string | null
  fecha_hora_agendada: string | null
  fecha_hora_limite: string | null
  fecha_llegada: string | null
  fecha_salida: string | null
  fecha_fin: string | null
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
  motivo_cancelacion: string | null
  iniciado_por: string | null
  fecha_creado: string
  fecha_hora_agendada: string | null
  fecha_hora_limite: string | null
  fecha_hora_servicio: string | null
  archived_at: string | null
  // joined
  unidad_name?: string
  ruta_name?: string
  customer_name?: string
  iniciado_por_username?: string
  order_number?: string | null
  project_id?: string | null
  project_number?: string | null
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
         sp.number AS project_number
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

export async function listServiceOrdersByProject(projectId: string): Promise<ServiceOrder[]> {
  const { rows } = await pool.query(
    `${SO_SELECT} WHERE so.service_project_id = $1 ORDER BY so.created_at DESC`,
    [projectId]
  )
  return rows
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
  foja_de_ruta?: string | null
  comentarios_de_soporte?: string | null
  encargados?: string | null
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
          foja_de_ruta, comentarios_de_soporte, encargados,
          fecha_hora_agendada, fecha_hora_limite, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        number, data.service_project_id,
        data.motivo_del_servicio ?? null, data.ubicacion ?? null, data.referencias ?? null,
        data.foja_de_ruta ?? null, data.comentarios_de_soporte ?? null, data.encargados ?? null,
        data.fecha_hora_agendada ?? null, data.fecha_hora_limite ?? null, data.created_by,
      ]
    )
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
  'estatus' | 'motivo_del_servicio' | 'ubicacion' | 'referencias' | 'foja_de_ruta' |
  'comentarios_de_soporte' | 'encargados' | 'fecha_hora_agendada' | 'fecha_hora_limite' |
  'fecha_llegada' | 'fecha_salida' | 'fecha_fin'>>

export async function updateServiceOrder(id: string, data: UpdatableOrderFields): Promise<void> {
  const fields: string[] = []
  const values: unknown[] = []
  let i = 1
  const setField = (col: string, val: unknown) => { fields.push(`${col} = $${i++}`); values.push(val) }
  if (data.estatus !== undefined) setField('estatus', data.estatus)
  if (data.motivo_del_servicio !== undefined) setField('motivo_del_servicio', data.motivo_del_servicio)
  if (data.ubicacion !== undefined) setField('ubicacion', data.ubicacion)
  if (data.referencias !== undefined) setField('referencias', data.referencias)
  if (data.foja_de_ruta !== undefined) setField('foja_de_ruta', data.foja_de_ruta)
  if (data.comentarios_de_soporte !== undefined) setField('comentarios_de_soporte', data.comentarios_de_soporte)
  if (data.encargados !== undefined) setField('encargados', data.encargados)
  if (data.fecha_hora_agendada !== undefined) setField('fecha_hora_agendada', data.fecha_hora_agendada)
  if (data.fecha_hora_limite !== undefined) setField('fecha_hora_limite', data.fecha_hora_limite)
  if (data.fecha_llegada !== undefined) setField('fecha_llegada', data.fecha_llegada)
  if (data.fecha_salida !== undefined) setField('fecha_salida', data.fecha_salida)
  if (data.fecha_fin !== undefined) setField('fecha_fin', data.fecha_fin)
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
     JOIN service_technicians st ON st.service_id = srv.id
     WHERE st.user_id = $1
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
  srv.technicians = await listServiceTechnicians(id)
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
  fecha_hora_agendada?: string | null
  fecha_hora_limite?: string | null
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
          motivo_visita, referencia, ubicacion, ubicacion_txt,
          fecha_hora_agendada, fecha_hora_limite, iniciado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        number, data.service_order_id ?? null, data.unidad_id ?? null, data.ruta_id ?? null,
        data.customer_id ?? null, data.motivo_visita ?? null, data.referencia ?? null,
        data.ubicacion ?? null, data.ubicacion_txt ?? null,
        data.fecha_hora_agendada ?? null, data.fecha_hora_limite ?? null, data.iniciado_por,
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
  'fecha_hora_agendada' | 'fecha_hora_limite' | 'fecha_hora_servicio'>>

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
  if (fields.length === 0) return
  values.push(id)
  await pool.query(`UPDATE services SET ${fields.join(', ')} WHERE id = $${i}`, values)
}

export async function deleteService(id: string): Promise<void> {
  await pool.query(`DELETE FROM services WHERE id = $1`, [id])
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
 * create a service_project + one service_order + one service per is_service line
 * (multiplied by unit_count when applicable).
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
      `SELECT s.id, s.number, s.customer_id, s.quote_id, s.unit_count, q.number AS quote_number
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
      `SELECT ql.product_id, p.name AS product_name
       FROM quote_lines ql
       JOIN products p ON p.id = ql.product_id
       WHERE ql.quote_id = $1 AND p.is_service = true AND ql.display_type = 'product'`,
      [sale.quote_id]
    )
    if (serviceLines.length === 0) {
      await client.query('ROLLBACK')
      return null
    }

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

    const orderNumber = await generateNumber('OSV', 'service_orders', client)
    const { rows: [order] } = await client.query(
      `INSERT INTO service_orders (number, service_project_id, motivo_del_servicio, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [orderNumber, project.id, 'Instalación / servicio de cotización', userId]
    )

    const unitCount = Math.max(1, Number(sale.unit_count) || 1)
    for (const line of serviceLines) {
      for (let u = 0; u < unitCount; u++) {
        const srvNumber = await generateNumber('SRV', 'services', client)
        await client.query(
          `INSERT INTO services
             (number, service_order_id, customer_id, motivo_visita, iniciado_por)
           VALUES ($1, $2, $3, $4, $5)`,
          [srvNumber, order.id, sale.customer_id, line.product_name, userId]
        )
      }
    }

    await client.query('COMMIT')
    return project
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
