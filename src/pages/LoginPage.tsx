import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ShieldCheck, ArrowRight, Loader2, ChevronLeft, Car, UserRoundCheck, CheckCircle2 } from 'lucide-react';
import { api } from '../api/axios';
import { DIGITS_ONLY_REGEX } from '../utils/regex';

type Step = 'phone' | 'otp';
interface LoginPublicStats {
  onlineDrivers: number;
  todayTrips: number;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('phone');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [publicStats, setPublicStats] = useState<LoginPublicStats | null>(null);
  const [publicStatsLoading, setPublicStatsLoading] = useState(true);

  const [digits, setDigits] = useState('');
  const phone = `+380${digits}`;
  const isPhoneValid = digits.length === 9;
  const cardClass = 'rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8';
  const fieldLabelClass = 'mb-2 block text-sm font-medium text-slate-300';
  const errorBoxClass = 'rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300';
  const primaryButtonClass =
    'login-accent-glow mt-1 flex h-[58px] w-full items-center justify-center gap-2 rounded-full bg-[#EAB308] px-4 text-base font-semibold text-[#0F172A] transition-[filter,opacity,box-shadow] duration-300 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none';
  const statCardClass =
    'rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl sm:p-5';

  const loadPublicStats = async () => {
    setPublicStatsLoading(true);
    try {
      const response = await api.get<LoginPublicStats>('/auth/public-stats');
      setPublicStats(response.data);
    } catch {
      setPublicStats(null);
    } finally {
      setPublicStatsLoading(false);
    }
  };

  useEffect(() => {
    void loadPublicStats();
  }, []);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/send-code', { phoneNumber: phone });
      setStep('otp');
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { code?: string } } })?.response?.data;
      if (data?.code === 'INACTIVE') {
        setError('Обліковий запис деактивовано. Зверніться до підтримки.');
      } else {
        setError('Номер не зареєстрований у системі.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post<{ token: string; role: string; requiresRegistration?: boolean }>(
        '/auth/verify-code',
        {
          phoneNumber: phone,
          code,
        }
      );
      const { token, role, requiresRegistration } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      if (requiresRegistration) {
        sessionStorage.setItem('registrationPending', 'true');
        navigate('/complete-registration', { replace: true });
      } else {
        navigate(role === 'Manager' || role === 'SuperAdmin' ? '/manager/whitelist' : '/driver/dashboard', {
          replace: true,
        });
      }
    } catch {
      setError('Невірний або прострочений код.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0F172A] lg:flex">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_65%_at_78%_45%,rgba(234,179,8,0.11),transparent_58%),radial-gradient(ellipse_100%_80%_at_50%_100%,rgba(15,23,42,0.4),transparent_55%)]"
        aria-hidden
      />

      <div className="relative z-[1] flex min-h-[100dvh] w-full flex-col items-center justify-center px-6 py-8 sm:px-8 lg:min-h-screen lg:w-1/2 lg:py-12">
        <div className="w-full max-w-lg">
          <div className="mb-6 flex flex-col items-center gap-3 lg:mb-5">
            <div className="flex items-center justify-center gap-4">
              <div className="login-accent-glow flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EAB308]">
                <Car className="h-7 w-7 text-[#0F172A]" />
              </div>
              <h1 className="text-left text-5xl font-bold tracking-tight text-white">
                Taxi <span className="text-[#EAB308]">839</span>
              </h1>
            </div>
            <p className="text-center text-sm text-slate-400">Таксі - це просто, зручно та швидко.</p>
          </div>

          <div className={cardClass}>
            <h2 className="mb-6 text-2xl font-semibold text-white">{step === 'phone' ? 'Вхід до системи' : 'Підтвердження'}</h2>

            {step === 'phone' ? (
              <form onSubmit={handleSendCode} className="space-y-5">
                <div>
                  <label className={fieldLabelClass}>Номер телефону</label>
                  <div className="login-field-outline flex items-center overflow-hidden rounded-2xl border border-white/10 bg-[#1E293B]">
                    <div className="flex items-center gap-2 border-r border-white/10 px-4 py-4">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span className="font-mono text-lg text-slate-300">+380</span>
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="XXXXXXXXX"
                      value={digits}
                      onChange={(e) => {
                        const val = e.target.value.replace(DIGITS_ONLY_REGEX, '');
                        if (val.length <= 9) {
                          setDigits(val);
                          if (val.length === 0) setError('');
                        }
                      }}
                      required
                      className="min-w-0 flex-1 bg-transparent px-4 py-4 font-mono text-lg text-white outline-none placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {error && <div className={errorBoxClass}>{error}</div>}

                <button type="submit" disabled={loading || !isPhoneValid} className={primaryButtonClass}>
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Отримати код
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-slate-400">Ви отримаєте одноразовий код підтвердження.</p>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-5">
                <div>
                  <label className={fieldLabelClass}>Код підтвердження</label>
                  <div className="login-field-outline relative overflow-hidden rounded-2xl border border-white/10 bg-[#1E293B]">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <ShieldCheck className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="000000"
                      maxLength={6}
                      value={code}
                      onChange={(e) => {
                        const val = e.target.value.replace(DIGITS_ONLY_REGEX, '');
                        setCode(val);
                        if (val.length === 0) setError('');
                      }}
                      required
                      autoFocus
                      className="w-full bg-transparent py-4 pl-11 pr-11 text-center font-mono text-lg tabular-nums tracking-[0.2em] text-white outline-none placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {error && <div className={errorBoxClass}>{error}</div>}

                <button type="submit" disabled={loading || code.length !== 6} className={primaryButtonClass}>
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Увійти
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-slate-400">Код дійсний протягом 5 хвилин.</p>

                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setCode('');
                    setError('');
                    setDigits('');
                  }}
                  className="flex w-full items-center justify-center gap-1.5 py-1 text-sm text-slate-400 transition-colors hover:text-slate-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Змінити номер
                </button>
              </form>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className={statCardClass}>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
                  <UserRoundCheck className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums text-white">
                    {publicStatsLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : publicStats ? (
                      String(publicStats.onlineDrivers)
                    ) : (
                      '—'
                    )}
                  </p>
                  <p className="mt-1 text-xs leading-snug text-slate-400 sm:text-sm">Онлайн водіїв</p>
                </div>
              </div>
            </div>
            <div className={statCardClass}>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums text-white">
                    {publicStatsLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : publicStats ? (
                      String(publicStats.todayTrips)
                    ) : (
                      '—'
                    )}
                  </p>
                  <p className="mt-1 text-xs leading-snug text-slate-400 sm:text-sm">Сьогодні поїздок</p>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500 sm:mt-8">© 2026 Taxi 839. Всі права захищені.</p>
        </div>
      </div>

      <div className="relative z-[1] hidden min-h-screen w-1/2 flex-col overflow-hidden lg:flex">
        <div className="relative flex min-h-0 flex-1 items-center justify-center p-6 sm:p-10">
          <div className="relative aspect-square w-full max-w-lg min-h-[280px] max-h-[min(72vh,520px)]">
            <div
              className="login-taxi-glow pointer-events-none absolute left-1/2 top-1/2 h-[125%] w-[125%] rounded-full bg-[radial-gradient(circle,rgba(234,179,8,0.5)_0%,rgba(234,179,8,0.16)_40%,transparent_72%)] blur-3xl"
              aria-hidden
            />
            <div className="absolute inset-0 z-[1] flex items-center justify-center">
              <svg
                className="h-[76%] w-[76%] max-h-[min(48vh,400px)] max-w-[min(48vh,400px)] text-[#EAB308] opacity-[0.42]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.32"
                aria-hidden
              >
                <path d="M8 6h8M6 10h12M3 14h18M5 18h14" />
                <rect x="4" y="8" width="16" height="10" rx="2" />
                <circle cx="7" cy="18" r="2" />
                <circle cx="17" cy="18" r="2" />
              </svg>
            </div>
            <svg
              className="pointer-events-none absolute inset-0 z-[2] h-full w-full"
              viewBox="0 0 800 800"
              fill="none"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden
            >
              <path
                className="login-route-line login-route-line--a"
                d="M 80 410 Q 240 190 400 410 T 720 410"
                stroke="#EAB308"
                strokeWidth="3"
              />
              <path
                className="login-route-line login-route-line--b"
                d="M 140 510 Q 300 290 460 510 T 760 510"
                stroke="#EAB308"
                strokeWidth="2.5"
              />
              <path
                className="login-route-line login-route-line--c"
                d="M 40 310 Q 220 90 380 310 T 680 310"
                stroke="#EAB308"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
