import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { redirect } from 'next/navigation'
import DiscountApprovalsClient from './_components/DiscountApprovalsClient'

export default async function DiscountApprovalsPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (session.role !== 'admin') redirect('/admin')
  return <DiscountApprovalsClient />
}
