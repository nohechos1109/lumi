'use client'

import { useState } from 'react'
import type { ServiceProject, Service, ServiceRequest } from '@/lib/queries/servicios'
import ServiceProjectsTable from './ServiceProjectsTable'
import ServicesTable from './ServicesTable'
import ServiceRequestsTable from './ServiceRequestsTable'
import NewServiceProjectModal from './NewServiceProjectModal'
import NewServiceModal from './NewServiceModal'
import NewServiceRequestModal from './NewServiceRequestModal'

type Tab = 'projects' | 'services' | 'requests'

interface Props {
  role: string
  userId: string
  projects: ServiceProject[]
  services: Service[]
  requests: ServiceRequest[]
  perms: {
    createProject: boolean
    createService: boolean
    createRequest: boolean
    approveRequest: boolean
    tecnicoOnly: boolean
  }
}

export default function ServiciosLanding({ role, projects, services, requests, perms }: Props) {
  const initialTab: Tab = perms.tecnicoOnly ? 'services' : 'projects'
  const [tab, setTab] = useState<Tab>(initialTab)
  const [showNewProject, setShowNewProject] = useState(false)
  const [showNewService, setShowNewService] = useState(false)
  const [showNewRequest, setShowNewRequest] = useState(false)

  const tabs: { key: Tab; label: string; count: number; visible: boolean }[] = [
    { key: 'projects', label: 'Proyectos', count: projects.length, visible: !perms.tecnicoOnly },
    { key: 'services', label: perms.tecnicoOnly ? 'Mis Servicios' : 'Servicios', count: services.length, visible: true },
    { key: 'requests', label: 'Solicitudes', count: requests.length, visible: !perms.tecnicoOnly && (perms.createRequest || perms.approveRequest) },
  ]

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold" style={{ color: 'var(--c-ink)', letterSpacing: '0.04em' }}>
            Servicios
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-ghost)' }}>
            Gestión de proyectos, órdenes y servicios en campo
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {tab === 'projects' && perms.createProject && (
            <button
              onClick={() => setShowNewProject(true)}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: '#B45309', cursor: 'pointer', border: 'none' }}
            >
              + Nuevo Proyecto
            </button>
          )}
          {tab === 'services' && perms.createService && (
            <button
              onClick={() => setShowNewService(true)}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: '#B45309', cursor: 'pointer', border: 'none' }}
            >
              + Nuevo Servicio
            </button>
          )}
          {tab === 'requests' && perms.createRequest && (
            <button
              onClick={() => setShowNewRequest(true)}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: '#B45309', cursor: 'pointer', border: 'none' }}
            >
              + Nueva Solicitud
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 mb-6" style={{ borderBottom: '1px solid var(--c-rim)' }}>
        {tabs.filter(t => t.visible).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2.5 text-sm font-semibold transition-colors"
            style={{
              color: tab === t.key ? '#B45309' : 'var(--c-dim)',
              borderBottom: tab === t.key ? '2px solid #B45309' : '2px solid transparent',
              marginBottom: '-1px',
              background: 'transparent',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            {t.label}
            <span className="ml-2 text-xs font-mono px-2 py-0.5 rounded" style={{
              background: 'var(--c-panel)',
              color: 'var(--c-ghost)',
            }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {tab === 'projects' && <ServiceProjectsTable projects={projects} />}
      {tab === 'services' && <ServicesTable services={services} role={role} />}
      {tab === 'requests' && (
        <ServiceRequestsTable
          requests={requests}
          canApprove={perms.approveRequest}
        />
      )}

      {showNewProject && <NewServiceProjectModal onClose={() => setShowNewProject(false)} />}
      {showNewService && <NewServiceModal onClose={() => setShowNewService(false)} />}
      {showNewRequest && <NewServiceRequestModal onClose={() => setShowNewRequest(false)} />}
    </div>
  )
}
