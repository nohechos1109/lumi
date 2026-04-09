import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { listCustomers } from '@/lib/queries/customers'
import CustomersClient from './_components/CustomersClient'

export default async function CustomersPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  const customers = await listCustomers()
  return <CustomersClient role={session.role ?? 'sales'} initialCustomers={customers} />
}
