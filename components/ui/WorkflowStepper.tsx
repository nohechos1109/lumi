'use client'

import Link from 'next/link'

export type StepState = 'done' | 'current' | 'pending' | 'error'

export interface WorkflowStep {
  key: string
  label: string
  state: StepState
  sublabel?: string
  href?: string
}

interface Props {
  steps: WorkflowStep[]
  compact?: boolean
  orientation?: 'horizontal' | 'vertical'
}

const DOT = 36
const DOT_COMPACT = 24

function DotIcon({ state, num, compact }: { state: StepState; num: number; compact: boolean }) {
  const sz = compact ? 10 : 13
  if (state === 'done') return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
  if (state === 'error') return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
      <line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>
    </svg>
  )
  return <span style={{ fontSize: compact ? 10 : 12, fontWeight: 700, lineHeight: 1 }}>{num}</span>
}

function StepInner({
  step, num, dot, compact, dotStyle, labelColor, clickable,
}: {
  step: WorkflowStep
  num: number
  dot: number
  compact: boolean
  dotStyle: React.CSSProperties
  labelColor: string
  clickable: boolean
}) {
  return (
    <div
      className="flex flex-col items-center gap-1.5"
      style={{ minWidth: compact ? 56 : 76, cursor: clickable ? 'pointer' : 'default' }}
    >
      <div
        style={dotStyle}
        className={clickable ? 'group-hover:scale-110 group-hover:shadow-md transition-transform' : ''}
      >
        <DotIcon state={step.state} num={num} compact={compact} />
      </div>
      <span
        style={{
          fontSize: compact ? 10 : 11,
          fontWeight: step.state === 'current' ? 700 : 600,
          color: labelColor,
          letterSpacing: '0.025em',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          transition: 'opacity 150ms',
        }}
        className={clickable ? 'group-hover:opacity-75' : ''}
      >
        {step.label}
      </span>
      {step.sublabel && (
        <span style={{ fontSize: compact ? 9 : 10, color: 'var(--c-ghost)', textAlign: 'center', whiteSpace: 'nowrap', marginTop: -4 }}>
          {step.sublabel}
        </span>
      )}
    </div>
  )
}

function stepColors(state: StepState) {
  return {
    dotBg:
      state === 'done'    ? 'var(--c-navy)'    :
      state === 'current' ? 'var(--c-navy-bg)' :
      state === 'error'   ? '#FFE4E6'          : 'var(--c-card)',
    dotBorder:
      state === 'done'    ? 'var(--c-navy)'  :
      state === 'current' ? 'var(--c-navy)'  :
      state === 'error'   ? '#BE123C'        : 'var(--c-rim)',
    dotColor:
      state === 'done'    ? '#fff'           :
      state === 'current' ? 'var(--c-navy)'  :
      state === 'error'   ? '#BE123C'        : 'var(--c-ghost)',
    labelColor:
      state === 'current' ? 'var(--c-navy)'  :
      state === 'done'    ? 'var(--c-ink)'   :
      state === 'error'   ? '#BE123C'        : 'var(--c-ghost)',
  }
}

export default function WorkflowStepper({ steps, compact = false, orientation = 'horizontal' }: Props) {
  const dot = compact ? DOT_COMPACT : DOT

  if (orientation === 'vertical') {
    return (
      <div className="flex flex-col">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1
          const { dotBg, dotBorder, dotColor, labelColor } = stepColors(step.state)
          const isClickable = step.state === 'done' && !!step.href
          const lineFilled = step.state === 'done'
          const dotStyle: React.CSSProperties = {
            width: 28, height: 28, borderRadius: '50%',
            border: `2px solid ${dotBorder}`,
            background: dotBg, color: dotColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: step.state === 'current' ? '0 0 0 3px color-mix(in srgb, var(--c-navy) 12%, transparent)' : 'none',
          }
          const label = (
            <div style={{ paddingBottom: isLast ? 0 : 20 }}>
              <span style={{ fontSize: 12, fontWeight: step.state === 'current' ? 700 : 500, color: labelColor, display: 'block' }}>
                {step.label}
              </span>
              {step.sublabel && (
                <span style={{ fontSize: 10, color: 'var(--c-ghost)', display: 'block', marginTop: 1 }}>{step.sublabel}</span>
              )}
            </div>
          )
          return (
            <div key={step.key} style={{ display: 'flex', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {isClickable ? (
                  <Link href={step.href!} style={{ textDecoration: 'none' }}>
                    <div style={dotStyle}><DotIcon state={step.state} num={i + 1} compact={false} /></div>
                  </Link>
                ) : (
                  <div style={dotStyle}><DotIcon state={step.state} num={i + 1} compact={false} /></div>
                )}
                {!isLast && (
                  <div style={{
                    flex: 1,
                    width: 2,
                    minHeight: 16,
                    marginTop: 3,
                    background: lineFilled ? 'var(--c-navy)' : 'transparent',
                    borderLeft: lineFilled ? 'none' : '2px dashed var(--c-rim)',
                  }} />
                )}
              </div>
              <div style={{ paddingTop: 4 }}>
                {isClickable ? (
                  <Link href={step.href!} style={{ textDecoration: 'none' }}>{label}</Link>
                ) : label}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div
      className="mb-6"
      style={{
        borderBottom: '1px solid var(--c-rim)',
        padding: compact ? '10px 0 14px' : '12px 0 16px',
      }}
    >
      <div className="flex items-center justify-between gap-0 overflow-x-auto" data-no-drag>
        {steps.map((step, i) => {
          const next = steps[i + 1]
          const lineFilled = step.state === 'done' && next && (next.state === 'done' || next.state === 'current')
          const isClickable = step.state === 'done' && !!step.href
          const { dotBg, dotBorder, dotColor, labelColor } = stepColors(step.state)

          const dotStyle: React.CSSProperties = {
            width: dot, height: dot, borderRadius: '50%',
            border: `2px solid ${dotBorder}`,
            background: dotBg, color: dotColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: step.state === 'current' ? '0 0 0 4px color-mix(in srgb, var(--c-navy) 10%, transparent)' : 'none',
            transition: 'transform 150ms ease, box-shadow 150ms ease',
          }

          const innerProps = { step, num: i + 1, dot, compact, dotStyle, labelColor, clickable: isClickable }

          return (
            <div key={step.key} className="flex items-center flex-1 min-w-0">
              {isClickable ? (
                <Link href={step.href!} className="group flex flex-col items-center" style={{ textDecoration: 'none' }}>
                  <StepInner {...innerProps} />
                </Link>
              ) : (
                <StepInner {...innerProps} />
              )}

              {next && (
                <div
                  className="flex-1 mx-1 sm:mx-2"
                  style={{
                    marginBottom: compact ? 20 : 26,
                    height: 2,
                    borderRadius: 9999,
                    background: lineFilled
                      ? 'linear-gradient(to right, var(--c-navy), color-mix(in srgb, var(--c-navy) 60%, transparent))'
                      : 'transparent',
                    borderTop: lineFilled ? 'none' : '2px dashed var(--c-rim)',
                    transition: 'background 300ms',
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
