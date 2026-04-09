'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ConfirmModal from '@/components/ui/ConfirmModal'
import DuplicateQuoteModal from '@/components/ui/DuplicateQuoteModal'
import LevantamientoModal from '@/components/ui/LevantamientoModal'
import { toast } from '@/lib/toast'

interface Props {
  quoteId: string
  currentState: string
  role: string
  projectId: string | null
  projectName: string | null
  installationNotes?: string | null
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  sales:   ['draft', 'sent', 'confirmed', 'cancelled', 'expired'],
  manager: ['draft', 'sent', 'confirmed', 'cancelled', 'expired'],
  admin:   ['draft', 'sent', 'confirmed', 'cancelled', 'expired'],
}

export default function QuoteActions({ quoteId, currentState, role, projectId, projectName, installationNotes }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [showLevantamientoModal, setShowLevantamientoModal] = useState(false)

  const btnBase = `text-sm px-4 py-2 rounded-xl font-semibold transition-opacity ${loading ? 'opacity-50 pointer-events-none' : 'hover:opacity-80'}`

  function handleDuplicated(newQuoteId: string, newQuoteNumber: string) {
    setShowDuplicateModal(false)
    toast(`Cotización duplicada: ${newQuoteNumber}`)
    router.push(`/quotes/${newQuoteId}`)
  }

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        <Link
          href={`/api/pdf/${quoteId}`}
          target="_blank"
          className={btnBase}
          style={{ background: 'var(--c-panel)', color: 'var(--c-dim)', border: '1px solid var(--c-rim)' }}
        >
          Exportar PDF
        </Link>

        <button
          onClick={() => setShowLevantamientoModal(true)}
          className={btnBase}
          style={{ background: 'var(--c-panel)', color: 'var(--c-dim)', border: '1px solid var(--c-rim)' }}
        >
          Levantamiento PDF
        </button>

        <button
          onClick={() => setShowDuplicateModal(true)}
          className={btnBase}
          style={{ background: 'var(--c-panel)', color: 'var(--c-dim)', border: '1px solid var(--c-rim)' }}
        >
          Duplicar
        </button>
      </div>

      {showLevantamientoModal && (
        <LevantamientoModal
          quoteId={quoteId}
          installationNotes={installationNotes}
          onClose={() => setShowLevantamientoModal(false)}
        />
      )}

      {showDuplicateModal && (
        <DuplicateQuoteModal
          quoteId={quoteId}
          currentProjectId={projectId}
          currentProjectName={projectName}
          role={role}
          onClose={() => setShowDuplicateModal(false)}
          onDuplicated={handleDuplicated}
        />
      )}
    </>
  )
}
