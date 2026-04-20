'use client'

import { useState } from 'react'
import type { ServiceProject, ServiceOrder, Service, ServiceRequest } from '@/lib/queries/servicios'
import ServiceProjectsTable from './ServiceProjectsTable'
import ServiceOrdersTable from './ServiceOrdersTable'
import ServicesTable from './ServicesTable'
import ServiceRequestsTable from './ServiceRequestsTable'
import NewServiceProjectModal from './NewServiceProjectModal'
import NewServiceModal from './NewServiceModal'
import NewServiceRequestModal from './NewServiceRequestModal'

type Tab = 'projects' | 'orders' | 'services' | 'requests'

interface Props {
  role: string
  userId: string
  projects: ServiceProject[]
  orders: ServiceOrder[]
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

export default function ServiciosLanding({ role, projects, orders, services, requests, perms }: Props) {
  const initialTab: Tab = perms.tecnicoOnly ? 'services' : 'projects'
  const [tab, setTab] = useState<Tab>(initialTab)
  const [showNewProject, setShowNewProject] = useState(false)
  const [showNewService, setShowNewService] = useState(false)
  const [showNewRequest, setShowNewRequest] = useState(false)

  const tabs: { key: Tab; label: string; count: number; visible: boolean }[] = [
    { key: 'projects', label: 'Planeación', count: projects.length, visible: !perms.tecnicoOnly },
    { key: 'orders', label: perms.tecnicoOnly ? 'Mis Órdenes' : 'Órdenes', count: orders.length, visible: true },
    { key: 'services', label: perms.tecnicoOnly ? 'Mis Servicios' : 'Servicios', count: services.length, visible: true },
    { key: 'requests', label: 'Solicitudes', count: requests.length, visible: !perms.tecnicoOnly && (perms.createRequest || perms.approveRequest) },
  ]

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Servicios</p>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--c-ink)', fontFamily: 'var(--font-montserrat)' }}>
            Servicios
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-ghost)' }}>
            Gestión de planeaciones, órdenes y servicios en campo
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {tab === 'projects' && perms.createProject && (
            <button
              onClick={() => setShowNewProject(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'var(--c-navy)', color: '#fff', boxShadow: '0 2px 8px rgba(37,99,235,0.25)', border: 'none', cursor: 'pointer' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nueva Planeación
            </button>
          )}
          {tab === 'services' && perms.createService && (
            <button
              onClick={() => setShowNewService(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'var(--c-navy)', color: '#fff', boxShadow: '0 2px 8px rgba(37,99,235,0.25)', border: 'none', cursor: 'pointer' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nuevo Servicio
            </button>
          )}
          {tab === 'requests' && perms.createRequest && (
            <button
              onClick={() => setShowNewRequest(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'var(--c-navy)', color: '#fff', boxShadow: '0 2px 8px rgba(37,99,235,0.25)', border: 'none', cursor: 'pointer' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nueva Solicitud
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
              color: tab === t.key ? 'var(--c-navy)' : 'var(--c-dim)',
              borderBottom: tab === t.key ? '2px solid var(--c-navy)' : '2px solid transparent',
              marginBottom: '-1px',
              background: 'transparent',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            {t.label}
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{
              background: tab === t.key ? 'var(--c-navy-bg)' : 'var(--c-panel)',
              color: tab === t.key ? 'var(--c-navy)' : 'var(--c-ghost)',
              border: tab === t.key ? '1px solid var(--c-navy-bd)' : '1px solid var(--c-rim)',
            }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {tab === 'projects' && <ServiceProjectsTable projects={projects} />}
      {tab === 'orders' && <ServiceOrdersTable orders={orders} />}
      {tab === 'services' && <ServicesTable services={services} role={role} canPromote={perms.createProject} />}
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
