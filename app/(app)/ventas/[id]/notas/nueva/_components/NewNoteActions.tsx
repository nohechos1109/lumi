'use client'

import { useRouter } from 'next/navigation'

export default function NewNoteActions({ saleId }: { saleId: string }) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={() => router.push(`/ventas/${saleId}`)}
        className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-75"
        style={{ background: 'transparent', color: 'var(--c-dim)', border: '1px solid var(--c-rim)' }}
      >
        Cancelar
      </button>
      <button
        type="submit"
        form="new-note-form"
        className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-50"
        style={{ background: '#059669', color: '#fff' }}
      >
        Crear Nota
      </button>
    </div>
  )
}
