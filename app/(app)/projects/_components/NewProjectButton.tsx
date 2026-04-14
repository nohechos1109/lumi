'use client'

import { useState } from 'react'
import NewProjectModal from './NewProjectModal'

export default function NewProjectButton() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="text-sm px-5 py-2.5 rounded-lg font-semibold transition-opacity hover:opacity-85"
        style={{ background: 'var(--c-navy)', color: '#FFFFFF', cursor: 'pointer', border: 'none' }}
      >
        + Nuevo Proyecto
      </button>

      {showModal && (
        <NewProjectModal onClose={() => setShowModal(false)} />
      )}
    </>
  )
}
