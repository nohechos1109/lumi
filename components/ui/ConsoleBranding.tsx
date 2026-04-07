'use client'
import { useEffect } from 'react'

export function ConsoleBranding() {
  useEffect(() => {
    console.log(
      '%c' +
      '                   __\n' +
      '                  / _)\n' +
      '         _.----._/ /\n' +
      '        /         /\n' +
      '     __/ (  | (  |\n' +
      '    /__.-\'|_|--|_|\n',
      'color: #4ade80; font-family: monospace; font-size: 13px; line-height: 1.4;'
    )

    console.log(
      '%cDESARROLLO',
      'color: #6366f1; font-weight: 900; font-size: 28px; font-family: monospace; letter-spacing: 6px;'
    )

    console.log(
      '%cJuan Pablo Vega Huerta  &  Daniel Beltrán',
      'color: #38bdf8; font-weight: bold; font-size: 13px; font-family: monospace;'
    )

    console.log(
      '%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'color: #334155; font-family: monospace;'
    )
  }, [])

  return null
}
