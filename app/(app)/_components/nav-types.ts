// app/(app)/_components/nav-types.ts

export interface NavItem {
  href: string
  label: string
  exact?: boolean
  icon: string  // key into ICON_MAP in AppLauncherPanel
  color: string // CSS color value for card accent
}
