'use client'
import { useEffect } from 'react'

export function ConsoleBranding() {
  useEffect(() => {
    const dino = `
%c
  ██████████████████████████████████████████████████████
  █                                                    █
  █                                                    █
  █        .-=-.    .--.                               █
  █       /( o )\  / /  \\                              █
  █      | \___/ |/ | () |                             █
  █      |  ___  |\ \\  /                               █
  █      | |   | | '--'                                █
  █       \\|   |/                                      █
  █    ____\   /____                                   █
  █   /    '---'    \\                                  █
  █  |  ___________  |  DESARROLLO POR:               █
  █  | |             | |                               █
  █  | |  Juan Pablo | |  Vega Huerta                 █
  █  | |             | |                               █
  █  | |  &          | |                               █
  █  | |             | |                               █
  █  | |  Daniel     | |  Beltrán                     █
  █  | |_____________| |                               █
  █  |_________________|                               █
  █       |     |                                      █
  █      /|     |\\                                     █
  █                                                    █
  ██████████████████████████████████████████████████████
`
    console.log(
      dino,
      'color: #2563eb; font-weight: bold; font-family: monospace; font-size: 11px; line-height: 1.2;'
    )

    const ascii = `
%c ____  ____  ____  __   ____  ____  _____  __    __    ____
/ ___)(  __)(  __)/ _\\ (  _ \\(  _ \\(  _  )(  )  (  )  /  _ \\
\\___ \\ ) _)  ) _)/    \\ )   / )   / )(_)(  )(__ / (_/\\) O (
(____/(____)(__)  \\_/\\_/(__\\_)(__)__)(____)(____)\\____/\\____/

%cJuan Pablo Vega Huerta  &  Daniel Beltrán
%c─────────────────────────────────────────────
`
    console.log(
      ascii,
      'color: #6366f1; font-weight: bold; font-family: monospace; font-size: 12px;',
      'color: #0ea5e9; font-weight: bold; font-family: monospace; font-size: 13px;',
      'color: #64748b; font-family: monospace;'
    )
  }, [])

  return null
}
