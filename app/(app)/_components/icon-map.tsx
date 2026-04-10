import {
  IconDashboard, IconProjects, IconQuotes, IconCatalog,
  IconCustomers, IconTemplates, IconTeam, IconUsers,
  IconProducts, IconDiscounts, IconSettings, IconCobranza, IconPagos,
} from './NavIcons'

export const ICON_MAP: Record<string, React.ReactNode> = {
  dashboard:  <IconDashboard />,
  projects:   <IconProjects />,
  quotes:     <IconQuotes />,
  catalog:    <IconCatalog />,
  customers:  <IconCustomers />,
  templates:  <IconTemplates />,
  team:       <IconTeam />,
  users:      <IconUsers />,
  products:   <IconProducts />,
  discounts:  <IconDiscounts />,
  settings:   <IconSettings />,
  cobranza:   <IconCobranza />,
  pagos:      <IconPagos />,
}
