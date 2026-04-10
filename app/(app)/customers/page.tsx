import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { notFound } from 'next/navigation'
import { sessionOptions, SessionData } from '@/lib/session'
import { listContacts } from '@/lib/queries/customers'
import CustomersClient from './_components/CustomersClient'

export default async function CustomersPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (session.role === 'almacen' || session.role === 'soporte') notFound()
  const customers = await listContacts()
  return <CustomersClient role={session.role ?? 'sales'} initialCustomers={customers} />
}
