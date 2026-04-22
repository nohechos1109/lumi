import pool from '@/lib/db'

export type ProjectStatus = 'draft' | 'process' | 'approved' | 'demo' | 'follow_up' | 'closed' | 'deleted';

export interface Project {
  id: string;
  name: string;
  customer_id: string;
  customer_name?: string;
  date: string;
  status: ProjectStatus;
  description: string | null;
  user_id: string | null;
  executive_name?: string;
  created_at: string;
  archived_at: string | null;
  quote_count?: number;  // Number of associated quotes
  ruta_id: string | null;
  ruta_name?: string;
}

export async function listProjectsByUser(userId: string): Promise<Project[]> {
  const { rows } = await pool.query(
    `SELECT p.*, c.name as customer_name, u.username as executive_name,
            r.name as ruta_name,
            COALESCE((SELECT COUNT(*) FROM quotes q WHERE q.project_id = p.id), 0)::int as quote_count
     FROM projects p
     LEFT JOIN contacts c ON c.id = p.customer_id
     LEFT JOIN users u ON u.id = p.user_id
     LEFT JOIN rutas r ON r.id = p.ruta_id
     WHERE p.user_id = $1
     ORDER BY p.date DESC, p.created_at DESC`,
    [userId]
  );
  return rows;
}

export async function listAllProjects(): Promise<Project[]> {
  const { rows } = await pool.query(
    `SELECT p.*, c.name as customer_name, u.username as executive_name,
            r.name as ruta_name,
            COALESCE((SELECT COUNT(*) FROM quotes q WHERE q.project_id = p.id), 0)::int as quote_count
     FROM projects p
     LEFT JOIN contacts c ON c.id = p.customer_id
     LEFT JOIN users u ON u.id = p.user_id
     LEFT JOIN rutas r ON r.id = p.ruta_id
     ORDER BY p.date DESC, p.created_at DESC`
  );
  return rows;
}

export async function getProject(id: string): Promise<Project | null> {
  const { rows } = await pool.query(
    `SELECT p.*, c.name as customer_name, u.username as executive_name,
            r.name as ruta_name
     FROM projects p
     LEFT JOIN contacts c ON c.id = p.customer_id
     LEFT JOIN users u ON u.id = p.user_id
     LEFT JOIN rutas r ON r.id = p.ruta_id
     WHERE p.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export interface CreateProjectInput {
  name: string;
  customer_id: string;
  date?: string;
  status?: ProjectStatus;
  description?: string;
  user_id: string;
  ruta_id?: string | null;
}

export async function createProject(data: CreateProjectInput): Promise<Project> {
  const { rows } = await pool.query(
    `INSERT INTO projects
       (name, customer_id, date, status, description, user_id, ruta_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      data.name,
      data.customer_id,
      data.date || new Date().toISOString().split('T')[0],
      data.status || 'draft',
      data.description || null,
      data.user_id,
      data.ruta_id ?? null,
    ]
  );
  return rows[0];
}

export async function updateProject(id: string, data: Partial<CreateProjectInput>): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];
  let i = 1;

  if (data.name !== undefined) { fields.push(`name = $${i++}`); values.push(data.name); }
  if (data.customer_id !== undefined) { fields.push(`customer_id = $${i++}`); values.push(data.customer_id); }
  if (data.date !== undefined) { fields.push(`date = $${i++}`); values.push(data.date); }
  if (data.status !== undefined) { fields.push(`status = $${i++}`); values.push(data.status); }
  if (data.description !== undefined) { fields.push(`description = $${i++}`); values.push(data.description); }
  if (data.ruta_id !== undefined) { fields.push(`ruta_id = $${i++}`); values.push(data.ruta_id ?? null); }

  if (fields.length === 0) return;

  values.push(id);
  await pool.query(`UPDATE projects SET ${fields.join(', ')} WHERE id = $${i}`, values);
}

export async function deleteProject(id: string): Promise<void> {
  await pool.query('UPDATE quotes SET project_id = NULL WHERE project_id = $1', [id]);
  const hasSales = (await pool.query(`SELECT to_regclass('public.sales') AS t`)).rows[0].t !== null
  if (hasSales) await pool.query('UPDATE sales SET project_id = NULL WHERE project_id = $1', [id])
  await pool.query('DELETE FROM projects WHERE id = $1', [id]);
}

export interface ProjectDependencies {
  quotes: number
  sales: number
  sale_amount_total: number
  total_hard: number
}

export async function getProjectDependencies(id: string): Promise<ProjectDependencies> {
  const hasSales = (await pool.query(`SELECT to_regclass('public.sales') AS t`)).rows[0].t !== null

  const salesCount = hasSales
    ? `(SELECT COUNT(*)::int FROM sales WHERE project_id = $1)`
    : `0::int`
  const saleAmount = hasSales
    ? `COALESCE((SELECT SUM(amount_total) FROM sales WHERE project_id = $1), 0)::float`
    : `0::float`

  const { rows } = await pool.query(
    `SELECT
       (SELECT COUNT(*)::int FROM quotes WHERE project_id = $1) AS quotes,
       ${salesCount}    AS sales,
       ${saleAmount}    AS sale_amount_total`,
    [id]
  )
  const r = rows[0]
  const total_hard = r.quotes + r.sales
  return { ...r, total_hard }
}

export async function deleteProjectCascade(id: string): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const hasPA      = (await client.query(`SELECT to_regclass('public.payment_applications') AS t`)).rows[0].t !== null
    const hasPayments = (await client.query(`SELECT to_regclass('public.payments') AS t`)).rows[0].t !== null
    const hasSales   = (await client.query(`SELECT to_regclass('public.sales') AS t`)).rows[0].t !== null

    if (hasPA) {
      await client.query(
        `DELETE FROM payment_applications
         WHERE sale_note_id IN (
           SELECT sn.id FROM sale_notes sn
           JOIN sales s ON s.id = sn.sale_id
           WHERE s.project_id = $1
         )`,
        [id]
      )
    }
    if (hasPayments) {
      await client.query('DELETE FROM payments WHERE sale_id IN (SELECT id FROM sales WHERE project_id = $1)', [id])
    }
    if (hasSales) {
      await client.query('DELETE FROM sales WHERE project_id = $1', [id])
    }
    await client.query('DELETE FROM quote_lines WHERE quote_id IN (SELECT id FROM quotes WHERE project_id = $1)', [id])
    await client.query('DELETE FROM quotes WHERE project_id = $1', [id])
    await client.query('DELETE FROM projects WHERE id = $1', [id])
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function archiveProject(id: string): Promise<void> {
  await pool.query('UPDATE projects SET archived_at = NOW() WHERE id = $1', [id]);
}

export async function unarchiveProject(id: string): Promise<void> {
  await pool.query('UPDATE projects SET archived_at = NULL WHERE id = $1', [id]);
}
