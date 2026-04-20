'use client'

export type StepState = 'done' | 'current' | 'pending' | 'error'

export interface WorkflowStep {
  key: string
  label: string
  state: StepState
  sublabel?: string
}

interface Props {
  steps: WorkflowStep[]
  compact?: boolean
}

function stateColors(state: StepState) {
  switch (state) {
    case 'done':
      return { bg: 'var(--c-navy)', border: 'var(--c-navy)', text: '#fff', label: 'var(--c-ink)' }
    case 'current':
      return { bg: 'var(--c-navy-bg)', border: 'var(--c-navy)', text: 'var(--c-navy)', label: 'var(--c-navy)' }
    case 'error':
      return { bg: '#FFE4E6', border: '#BE123C', text: '#BE123C', label: '#BE123C' }
    default:
      return { bg: 'var(--c-card)', border: 'var(--c-rim)', text: 'var(--c-ghost)', label: 'var(--c-ghost)' }
  }
}

export default function WorkflowStepper({ steps, compact = false }: Props) {
  const dot = compact ? 20 : 26

  return (
    <div
      className="rounded-xl p-4 mb-6"
      style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}
    >
      <div className="flex items-center justify-between gap-1 overflow-x-auto">
        {steps.map((step, i) => {
          const c = stateColors(step.state)
          const next = steps[i + 1]
          const lineDone = step.state === 'done' && next && (next.state === 'done' || next.state === 'current')

          return (
            <div key={step.key} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center gap-1.5 shrink-0" style={{ minWidth: compact ? 64 : 88 }}>
                <div
                  className="flex items-center justify-center rounded-full font-semibold transition-all"
                  style={{
                    width: dot, height: dot,
                    background: c.bg, border: `1.5px solid ${c.border}`, color: c.text,
                    fontSize: compact ? 10 : 11,
                  }}
                >
                  {step.state === 'done' && (
                    <svg width={compact ? 10 : 12} height={compact ? 10 : 12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                  {step.state === 'error' && (
                    <svg width={compact ? 10 : 12} height={compact ? 10 : 12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>
                    </svg>
                  )}
                  {(step.state === 'current' || step.state === 'pending') && (i + 1)}
                </div>
                <span
                  className="text-[10px] sm:text-xs font-semibold text-center whitespace-nowrap"
                  style={{ color: c.label, letterSpacing: '0.02em' }}
                >
                  {step.label}
                </span>
                {step.sublabel && (
                  <span className="text-[9px] sm:text-[10px] text-center whitespace-nowrap" style={{ color: 'var(--c-ghost)' }}>
                    {step.sublabel}
                  </span>
                )}
              </div>

              {next && (
                <div
                  className="flex-1 mx-1 sm:mx-2 self-start"
                  style={{
                    marginTop: dot / 2,
                    height: 2,
                    background: lineDone ? 'var(--c-navy)' : 'transparent',
                    opacity: lineDone ? 0.8 : 1,
                    borderTop: lineDone ? 'none' : '2px dashed var(--c-rim)',
                    borderRadius: lineDone ? 9999 : 0,
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
