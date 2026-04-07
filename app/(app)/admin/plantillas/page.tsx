import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { redirect } from 'next/navigation'
import PlantillasClient from './_components/PlantillasClient'

export default async function AdminPlantillasPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (session.role !== 'admin') redirect('/admin')
  return <PlantillasClient />
}
