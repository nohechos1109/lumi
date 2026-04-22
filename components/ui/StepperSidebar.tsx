'use client'

import { useState } from 'react'
import WorkflowStepper, { WorkflowStep } from './WorkflowStepper'

export default function StepperSidebar({ steps }: { steps: WorkflowStep[] }) {
  const [open, setOpen] = useState(false)

  const current = steps.find(s => s.state === 'current') ?? steps.filter(s => s.state === 'done').at(-1)
  const idx = current ? steps.indexOf(current) + 1 : null

  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)' }}>
      {/* Mobile: collapsed header + toggle */}
      <div className="lg:hidden">
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between gap-3"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-medium shrink-0" style={{ color: 'var(--c-ghost)', letterSpacing: '0.08em' }}>PROGRESO</span>
            {current && (
              <span className="text-xs font-semibold truncate" style={{ color: 'var(--c-navy)' }}>
                {idx}. {current.label}{current.sublabel ? ` · ${current.sublabel}` : ''}
              </span>
            )}
          </div>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ color: 'var(--c-ghost)', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        {open && (
          <div className="mt-4">
            <WorkflowStepper steps={steps} orientation="vertical" />
          </div>
        )}
      </div>

      {/* Desktop: always full */}
      <div className="hidden lg:block">
        <p className="text-xs font-medium mb-4" style={{ color: 'var(--c-ghost)', letterSpacing: '0.08em' }}>PROGRESO</p>
        <WorkflowStepper steps={steps} orientation="vertical" />
      </div>
    </div>
  )
}
