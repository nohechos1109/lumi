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
}

export async function listProjectsByUser(userId: string): Promise<Project[]> {
  const { rows } = await pool.query(
    `SELECT p.*, c.name as customer_name, u.username as executive_name,
            COALESCE((SELECT COUNT(*) FROM quotes q WHERE q.project_id = p.id), 0)::int as quote_count
     FROM projects p
     LEFT JOIN customers c ON c.id = p.customer_id
     LEFT JOIN users u ON u.id = p.user_id
     WHERE p.user_id = $1
     ORDER BY p.date DESC, p.created_at DESC`,
    [userId]
  );
  return rows;
}

export async function listAllProjects(): Promise<Project[]> {
  const { rows } = await pool.query(
    `SELECT p.*, c.name as customer_name, u.username as executive_name,
            COALESCE((SELECT COUNT(*) FROM quotes q WHERE q.project_id = p.id), 0)::int as quote_count
     FROM projects p
     LEFT JOIN customers c ON c.id = p.customer_id
     LEFT JOIN users u ON u.id = p.user_id
     ORDER BY p.date DESC, p.created_at DESC`
  );
  return rows;
}

export async function getProject(id: string): Promise<Project | null> {
  const { rows } = await pool.query(
    `SELECT p.*, c.name as customer_name, u.username as executive_name
     FROM projects p
     LEFT JOIN customers c ON c.id = p.customer_id
     LEFT JOIN users u ON u.id = p.user_id
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
}

export async function createProject(data: CreateProjectInput): Promise<Project> {
  const { rows } = await pool.query(
    `INSERT INTO projects
       (name, customer_id, date, status, description, user_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      data.name, 
      data.customer_id, 
      data.date || new Date().toISOString().split('T')[0], 
      data.status || 'draft', 
      data.description || null, 
      data.user_id
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

  if (fields.length === 0) return;

  values.push(id);
  await pool.query(`UPDATE projects SET ${fields.join(', ')} WHERE id = $${i}`, values);
}

export async function deleteProject(id: string): Promise<void> {
  // Option: We might want to just un-link quotes or restrict deletion if it has quotes.
  // For now, let's allow it but warn the user in UI if it has quotes.
  await pool.query('UPDATE quotes SET project_id = NULL WHERE project_id = $1', [id]);
  await pool.query('DELETE FROM projects WHERE id = $1', [id]);
}

export async function archiveProject(id: string): Promise<void> {
  await pool.query('UPDATE projects SET archived_at = NOW() WHERE id = $1', [id]);
}

export async function unarchiveProject(id: string): Promise<void> {
  await pool.query('UPDATE projects SET archived_at = NULL WHERE id = $1', [id]);
}
