import { Route, Settings, ShieldCheck, SquareParking, Users } from 'lucide-react';
import DashboardLayoutShell, { type DashboardNavLink } from './DashboardLayoutShell';
import { usePresenceHub } from '../hooks/usePresenceHub';
import { getCurrentRole } from '../utils/auth';
import { getRoleLabel } from '../utils/roles';

const managerNavLinks: DashboardNavLink[] = [
  { to: '/manager/whitelist', label: 'Whitelist', icon: ShieldCheck },
  { to: '/manager/managers', label: 'Менеджери', icon: Users },
  { to: '/manager/drivers', label: 'Водії', icon: SquareParking },
  { to: '/manager/rides', label: 'Поїздки', icon: Route },
  { to: '/manager/settings', label: 'Налаштування', icon: Settings }
];

export default function ManagerLayout() {
  const currentRole = getCurrentRole();
  usePresenceHub();

  return (
    <DashboardLayoutShell
      panelSubtitle="Панель менеджера"
      roleLabel={currentRole ? getRoleLabel(currentRole) : 'Невідома'}
      navLinks={managerNavLinks}
    />
  );
}
