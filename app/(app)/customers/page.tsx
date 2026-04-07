import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import CustomersClient from './_components/CustomersClient'

export default async function CustomersPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  return <CustomersClient role={session.role ?? 'sales'} />
}
