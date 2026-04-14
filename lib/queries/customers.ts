import pool from '@/lib/db'

export type ContactType = 'company' | 'person'

export interface ContactCompanyLink {
  id: string
  name: string
  role: string | null
  is_primary: boolean
}

export interface Contact {
  id: string
  type: ContactType
  name: string
  email: string | null
  phone: string | null
  first_name: string | null
  job_title: string | null
  tax_id: string | null
  created_at: string
  companies: ContactCompanyLink[]
}

// Kept for backward compatibility
export type Customer = Contact

const SELECT_CONTACTS = `
  SELECT
    c.id, c.type, c.name, c.email, c.phone,
    c.first_name, c.job_title,
    c.tax_id, c.created_at,
    COALESCE(
      jsonb_agg(
        jsonb_build_object('id', co.id, 'name', co.name, 'role', ccl.role, 'is_primary', ccl.is_primary)
        ORDER BY co.name
      ) FILTER (WHERE co.id IS NOT NULL),
      '[]'::jsonb
    ) AS companies
  FROM contacts c
  LEFT JOIN contact_company_links ccl ON ccl.contact_id = c.id
  LEFT JOIN contacts co ON co.id = ccl.company_id
`

export async function listContacts(): Promise<Contact[]> {
  const { rows } = await pool.query(
    `${SELECT_CONTACTS} GROUP BY c.id ORDER BY c.name`
  )
  return rows
}

// Backward compat alias
export const listCustomers = listContacts

export async function listCompanies(): Promise<Pick<Contact, 'id' | 'name'>[]> {
  const { rows } = await pool.query(
    `SELECT id, name FROM contacts WHERE type = 'company' ORDER BY name`
  )
  return rows
}

export async function getContact(id: string): Promise<Contact | null> {
  const { rows } = await pool.query(
    `${SELECT_CONTACTS} WHERE c.id = $1 GROUP BY c.id`,
    [id]
  )
  return rows[0] ?? null
}

export async function createContact(data: {
  type: ContactType
  name: string
  email?: string | null
  phone?: string | null
  first_name?: string | null
  job_title?: string | null
  tax_id?: string | null
}): Promise<Contact> {
  const { rows } = await pool.query(
    `INSERT INTO contacts (type, name, email, phone, first_name, job_title, tax_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      data.type,
      data.name,
      data.email ?? null,
      data.phone ?? null,
      data.first_name ?? null,
      data.job_title ?? null,
      data.tax_id ?? null,
    ]
  )
  const contact = rows[0]
  contact.companies = []
  return contact
}

// Backward compat
export async function createCustomer(name: string, email?: string, phone?: string): Promise<Contact> {
  return createContact({ type: 'company', name, email, phone })
}

export async function updateContact(id: string, data: {
  name?: string
  email?: string | null
  phone?: string | null
  first_name?: string | null
  job_title?: string | null
  tax_id?: string | null
}): Promise<void> {
  const fields: string[] = []
  const values: unknown[] = []
  let i = 1

  if (data.name !== undefined)       { fields.push(`name = $${i++}`);       values.push(data.name) }
  if (data.email !== undefined)      { fields.push(`email = $${i++}`);      values.push(data.email) }
  if (data.phone !== undefined)      { fields.push(`phone = $${i++}`);      values.push(data.phone) }
  if (data.first_name !== undefined) { fields.push(`first_name = $${i++}`); values.push(data.first_name) }
  if (data.job_title !== undefined)  { fields.push(`job_title = $${i++}`);  values.push(data.job_title) }
  if (data.tax_id !== undefined)     { fields.push(`tax_id = $${i++}`);     values.push(data.tax_id) }

  if (fields.length === 0) return
  values.push(id)
  await pool.query(`UPDATE contacts SET ${fields.join(', ')} WHERE id = $${i}`, values)
}

// Backward compat
export async function updateCustomer(id: string, name: string, email?: string, phone?: string): Promise<void> {
  return updateContact(id, { name, email: email ?? null, phone: phone ?? null })
}

export async function deleteContact(id: string): Promise<void> {
  await pool.query('DELETE FROM contacts WHERE id = $1', [id])
}

// Backward compat
export const deleteCustomer = deleteContact

// ─── Company-Person links ─────────────────────────────────────────────────────

export async function linkContactToCompany(
  contactId: string,
  companyId: string,
  role?: string | null,
  isPrimary = false
): Promise<void> {
  await pool.query(
    `INSERT INTO contact_company_links (contact_id, company_id, role, is_primary)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (contact_id, company_id) DO UPDATE SET role = EXCLUDED.role, is_primary = EXCLUDED.is_primary`,
    [contactId, companyId, role ?? null, isPrimary]
  )
}

export async function unlinkContactFromCompany(contactId: string, companyId: string): Promise<void> {
  await pool.query(
    `DELETE FROM contact_company_links WHERE contact_id = $1 AND company_id = $2`,
    [contactId, companyId]
  )
}

export async function getCompanyContacts(companyId: string): Promise<(Pick<Contact, 'id' | 'name' | 'email' | 'phone' | 'job_title'> & { role: string | null; is_primary: boolean })[]> {
  const { rows } = await pool.query(
    `SELECT c.id, c.name, c.email, c.phone, c.job_title, ccl.role, ccl.is_primary
     FROM contacts c
     JOIN contact_company_links ccl ON ccl.contact_id = c.id
     WHERE ccl.company_id = $1
     ORDER BY ccl.is_primary DESC, c.name`,
    [companyId]
  )
  return rows
}
