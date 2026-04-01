import { redirect } from 'next/navigation'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'

export default async function Home() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  if (!session.userId) {
    redirect('/login')
  }

  if (session.role === 'admin') redirect('/admin')
  if (session.role === 'manager') redirect('/manager')
  redirect('/quotes')
}
