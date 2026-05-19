import { BarChart3, ListOrdered, Power, Settings } from 'lucide-react';
import DashboardLayoutShell, { type DashboardNavLink } from './DashboardLayoutShell';
import { usePresenceHub } from '../hooks/usePresenceHub';

const driverNavLinks: DashboardNavLink[] = [
  { to: '/driver/shift', label: 'Зміна', icon: Power },
  { to: '/driver/orders', label: 'Замовлення', icon: ListOrdered },
  { to: '/driver/analytics', label: 'Аналітика', icon: BarChart3 },
  { to: '/driver/settings', label: 'Налаштування', icon: Settings }
];

export default function DriverLayout() {
  usePresenceHub();

  return (
    <DashboardLayoutShell
      panelSubtitle="Панель водія"
      roleLabel="Водій"
      navLinks={driverNavLinks}
    />
  );
}
