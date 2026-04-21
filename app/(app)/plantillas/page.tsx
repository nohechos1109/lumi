import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import PlantillasViewer from './_components/PlantillasViewer'
import PlantillasClient from '../admin/plantillas/_components/PlantillasClient'

export default async function PlantillasPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (session.role === 'almacen' || session.role === 'soporte') notFound()
  if (session.role === 'admin') redirect('/admin/plantillas')
  if (session.role === 'sales') return <PlantillasClient />
  return <PlantillasViewer />
}
