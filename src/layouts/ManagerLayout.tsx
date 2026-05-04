import { Car, LogOut, Settings, ShieldCheck, Users, UserRoundCheck } from 'lucide-react';
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

  const handleLogoClick = () => {
    navigate('/login');
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-[#0F172A] text-slate-100">
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="flex w-full shrink-0 flex-col border-b border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-5 lg:w-72 lg:border-b-0 lg:border-r lg:rounded-none lg:border-white/10">
          <div className="mb-6 flex items-center gap-3">
            <button
              type="button"
              onClick={handleLogoClick}
              className="manager-accent-glow manager-primary-btn flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAB308] transition-[filter,box-shadow] duration-300"
              aria-label="Перейти на сторінку входу"
            >
              <Car className="h-6 w-6 text-[#0F172A]" />
            </button>
            <div>
              <p className="text-lg font-bold tracking-tight text-white">
                Taxi <span className="text-[#EAB308]">839</span>
              </p>
              <p className="text-xs text-slate-400">Панель керування</p>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1 lg:min-h-0">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-[#EAB308]/15 text-[#EAB308]'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon size={18} strokeWidth={2} />
                {label}
              </NavLink>
            ))}
            <div className="mt-auto flex flex-col gap-3 pt-6">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
              >
                <LogOut size={18} />
                Вийти
              </button>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-300 backdrop-blur-sm">
                Роль: <span className="font-semibold text-[#EAB308]">{role ? getRoleLabel(role) : 'Невідома'}</span>
              </div>
            </div>
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="min-h-0 flex-1 px-3 pb-8 pt-4 sm:px-5 sm:pt-5">
            <Outlet />
          </main>

          <footer className="shrink-0 border-t border-white/10 px-3 py-4 text-center text-xs text-slate-500 sm:px-5">
            © 2026 Taxi 839. Всі права захищені.
          </footer>
        </div>
      </div>
    </div>
  );
}
