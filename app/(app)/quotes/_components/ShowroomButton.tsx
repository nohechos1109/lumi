'use client'

import { useState } from 'react'
import NewQuoteModal from './NewQuoteModal'

export default function ShowroomButton() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 text-sm px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider transition-opacity hover:opacity-85 self-start"
        style={{ background: '#0B9962', color: '#FFFFFF', letterSpacing: '0.08em', border: 'none', cursor: 'pointer' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
        Venta de Mostrador
      </button>

      {showModal && (
        <NewQuoteModal onClose={() => setShowModal(false)} />
      )}
    </>
  )
}
