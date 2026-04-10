// app/(app)/_components/nav-types.ts

export interface NavItem {
  href: string
  label: string
  exact?: boolean
  icon: string  // key into ICON_MAP
  color: string // CSS color value for card accent
  desc?: string // shown on dashboard cards
}
