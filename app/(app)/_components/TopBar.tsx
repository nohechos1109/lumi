import type { NavItem } from './nav-types'
import AppLauncherButton from './AppLauncherButton'
import UserMenu from './UserMenu'
import NotificationBell from '@/components/ui/NotificationBell'
import DynamicLogo from './DynamicLogo'

interface Props {
  items: NavItem[]
  username: string
  roleLabel: string
  userInitial: string
  homeHref: string
}

export default function TopBar({ items, username, roleLabel, userInitial, homeHref }: Props) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 h-14 flex items-center px-4 gap-3"
      style={{
        background: 'var(--c-panel)',
        borderBottom: '1px solid var(--c-rim)',
        boxShadow: '0 1px 6px rgba(15,23,42,0.05)',
      }}
    >
      {/* Logo — client component that reacts to pathname changes */}
      <DynamicLogo homeHref={homeHref} />

      {/* User menu (chip + dropdown with logout) */}
      <UserMenu username={username} roleLabel={roleLabel} userInitial={userInitial} />

      {/* Notifications */}
      <NotificationBell />

      {/* Waffle launcher button */}
      <AppLauncherButton items={items} />
    </header>
  )
}
