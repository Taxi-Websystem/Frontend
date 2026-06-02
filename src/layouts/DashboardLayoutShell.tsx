import type { LucideIcon } from 'lucide-react';
import { Car, LogOut } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import AuthBackgroundLayers from '../components/AuthBackgroundLayers';
import { useLogout } from '../hooks/useLogout';

export interface DashboardNavLink {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface DashboardLayoutShellProps {
  panelSubtitle: string;
  roleLabel: string;
  navLinks: DashboardNavLink[];
}

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
    isActive ? 'bg-[#EAB308]/15 text-[#EAB308]' : 'text-slate-300 hover:bg-white/5 hover:text-white'
  }`;

export default function DashboardLayoutShell({
  panelSubtitle,
  roleLabel,
  navLinks
}: DashboardLayoutShellProps) {
  const logout = useLogout();

  return (
    <div className="relative min-h-screen bg-[#0F172A] text-slate-100">
      <AuthBackgroundLayers />
      <div className="relative z-[1] flex flex-col lg:flex-row lg:items-start">
        <aside className="flex w-full shrink-0 flex-col border-b border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-5 lg:sticky lg:top-0 lg:h-screen lg:max-h-screen lg:w-72 lg:overflow-hidden lg:border-b-0 lg:border-r lg:border-white/10">
          <div className="mb-6 flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => void logout()}
              className="manager-accent-glow manager-primary-btn flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAB308] transition-[filter,box-shadow,opacity] duration-300"
              aria-label="Перейти на сторінку входу"
            >
              <Car className="h-6 w-6 text-[#0F172A]" />
            </button>
            <div>
              <p className="text-lg font-bold tracking-tight text-white">
                TAXI <span className="text-[#EAB308]">839</span>
              </p>
              <p className="text-xs text-slate-400">{panelSubtitle}</p>
            </div>
          </div>

          <nav className="flex min-h-0 flex-1 flex-col gap-1 lg:overflow-hidden">
            <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className={navLinkClassName}>
                  <Icon size={18} strokeWidth={2} />
                  {label}
                </NavLink>
              ))}
            </div>

            <div className="mt-4 flex shrink-0 flex-col gap-3 pt-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-300 backdrop-blur-sm">
                Роль: <span className="font-semibold text-[#EAB308]">{roleLabel}</span>
              </div>
              <button
                type="button"
                onClick={() => void logout()}
                className="sidebar-logout-btn flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
              >
                <LogOut size={18} />
                Вийти
              </button>
            </div>
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="min-h-0 flex-1 px-3 pb-8 pt-4 sm:px-5 sm:pt-5">
            <Outlet />
          </main>

          <footer className="shrink-0 border-t border-white/10 px-3 py-4 text-center text-xs leading-snug text-slate-500 sm:px-5">
            © 2026 TAXI 839. Всі права захищені.
          </footer>
        </div>
      </div>
    </div>
  );
}
