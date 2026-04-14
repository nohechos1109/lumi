'use client'

import { useState } from 'react'
import NewQuoteModal from '@/app/(app)/quotes/_components/NewQuoteModal'

interface Props {
  projectId: string
  customerId: string
  customerName: string
}

export default function NewQuoteButton({ projectId, customerId, customerName }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm px-5 py-2.5 rounded-lg font-semibold transition-opacity hover:opacity-85"
        style={{ background: 'var(--c-navy)', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
      >
        + Nueva Cotización
      </button>

      {open && (
        <NewQuoteModal
          onClose={() => setOpen(false)}
          projectId={projectId}
          customerId={customerId}
          customerName={customerName}
        />
      )}
    </>
  )
}
