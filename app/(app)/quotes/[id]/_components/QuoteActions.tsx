'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { toast } from '@/lib/toast'

interface Props {
  quoteId: string
  currentState: string
  role: string
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  sales:   ['draft', 'sent', 'confirmed', 'cancelled', 'expired'],
  manager: ['draft', 'sent', 'confirmed', 'cancelled', 'expired'],
  admin:   ['draft', 'sent', 'confirmed', 'cancelled', 'expired'],
}

export default function QuoteActions({ quoteId, currentState, role }: Props) {
  const [loading, setLoading] = useState(false)

  const btnBase = `text-sm px-4 py-2 rounded-xl font-semibold transition-opacity ${loading ? 'opacity-50 pointer-events-none' : 'hover:opacity-80'}`

  return (
    <div className="flex gap-2 flex-wrap">
      <Link
        href={`/api/pdf/${quoteId}`}
        target="_blank"
        className={btnBase}
        style={{ background: 'var(--c-panel)', color: 'var(--c-dim)', border: '1px solid var(--c-rim)' }}
      >
        Exportar PDF
      </Link>
    </div>
  )
}
