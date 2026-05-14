import { BarChart3, Car, LogOut, Power, Settings } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useEffect } from 'react';
import AuthBackgroundLayers from '../components/AuthBackgroundLayers';
import { clearAuth, getToken } from '../utils/auth';
import { api } from '../api/axios';

const links = [
  { to: '/driver/shift', label: 'Зміна', icon: Power },
  { to: '/driver/analytics', label: 'Аналітика', icon: BarChart3 },
  { to: '/driver/settings', label: 'Налаштування', icon: Settings }
];

function getPresenceHubUrl(): string {
  const baseUrl = (api.defaults.baseURL as string | undefined) ?? '';
  return `${baseUrl.replace(/\/api\/?$/, '')}/hubs/presence`;
}

export default function DriverLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      return;
    }

    const connection = new HubConnectionBuilder()
      .withUrl(getPresenceHubUrl(), {
        accessTokenFactory: () => getToken() ?? '',
        withCredentials: false
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('PresenceChanged', (payload: { userId: number; status: string }) => {
      window.dispatchEvent(new CustomEvent('presence:changed', { detail: payload }));
    });
    connection.on('DashboardDataChanged', (payload: { entity?: string; action?: string; userId?: number }) => {
      window.dispatchEvent(new CustomEvent('dashboard:data-changed', { detail: payload }));
    });

    void connection.start().catch(() => {
    });

    return () => {
      void connection.stop();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/presence/logout');
    } catch {
    } finally {
      clearAuth();
      navigate('/login', { replace: true });
    }
  };

  const handleLogoClick = async () => {
    await handleLogout();
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0F172A] text-slate-100">
      <AuthBackgroundLayers />
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="flex w-full shrink-0 flex-col border-b border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-5 lg:w-72 lg:border-b-0 lg:border-r lg:rounded-none lg:border-white/10">
          <div className="mb-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => void handleLogoClick()}
              className="manager-accent-glow manager-primary-btn flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAB308] transition-[filter,box-shadow,opacity] duration-300"
              aria-label="Перейти на сторінку входу"
            >
              <Car className="h-6 w-6 text-[#0F172A]" />
            </button>
            <div>
              <p className="text-lg font-bold tracking-tight text-white">
                Taxi <span className="text-[#EAB308]">839</span>
              </p>
              <p className="text-xs text-slate-400">Панель водія</p>
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
                onClick={() => void handleLogout()}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
              >
                <LogOut size={18} />
                Вийти
              </button>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-300 backdrop-blur-sm">
                Роль: <span className="font-semibold text-[#EAB308]">Водій</span>
              </div>
            </div>
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="min-h-0 flex-1 px-3 pb-8 pt-4 sm:px-5 sm:pt-5">
            <Outlet />
          </main>

          <footer className="shrink-0 border-t border-white/10 px-3 py-4 text-center text-xs leading-snug text-slate-500 sm:px-5">
            © 2026 Taxi 839. Всі права захищені.
          </footer>
        </div>
      </div>
    </div>
  );
}
