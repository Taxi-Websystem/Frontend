import { LogOut, Settings, ShieldCheck, Users, UserRoundCheck } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearAuth, getCurrentRole } from '../utils/auth';
import { getRoleLabel } from '../utils/roles';

const links = [
  { to: '/manager/whitelist', label: 'Whitelist', icon: ShieldCheck },
  { to: '/manager/managers', label: 'Менеджери', icon: Users },
  { to: '/manager/drivers', label: 'Водії', icon: UserRoundCheck },
  { to: '/manager/settings', label: 'Налаштування', icon: Settings }
];

export default function ManagerLayout() {
  const navigate = useNavigate();
  const role = getCurrentRole();

  const handleLogout = () => {
    clearAuth();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-yellow-400">Taxi 839</p>
              <h1 className="text-xl font-semibold">Панель керування</h1>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300">
              Роль: <span className="font-medium text-yellow-400">{role ? getRoleLabel(role) : 'Невідома'}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8 flex-1 w-full">
        <aside className="w-64 shrink-0 rounded-xl border border-gray-800 bg-gray-900 p-3">
          <nav className="space-y-1">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                    isActive
                      ? 'bg-yellow-400/15 text-yellow-400'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
            >
              <LogOut size={16} />
              Вийти
            </button>
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      <footer className="border-t border-gray-800 px-4 py-4 text-center text-xs text-gray-500">
        © 2026 Taxi 839. Всі права захищені.
      </footer>
    </div>
  );
}
