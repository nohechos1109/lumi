import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { redirect } from 'next/navigation'
import PlantillasViewer from './_components/PlantillasViewer'

export default async function PlantillasPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (session.role === 'admin') redirect('/admin/plantillas')
  return <PlantillasViewer />
}
