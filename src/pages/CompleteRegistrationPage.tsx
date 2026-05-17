import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Car, Gauge, Loader2, Save, ShieldCheck } from 'lucide-react';
import AuthBackgroundLayers from '../components/AuthBackgroundLayers';
import { api } from '../api/axios';
import type { AppRole } from '../utils/auth';
import { sanitizeCarBrandOrModel, sanitizeCarColorUa } from '../utils/carFields';
import { formatLicensePlateInput, LICENSE_PLATE_REGEX } from '../utils/licensePlate';
import { sanitizeNameUa } from '../utils/nameFields';
import { DIGITS_ONLY_REGEX } from '../utils/regex';

interface AuthMe {
  phoneNumber: string;
  name: string;
  carBrand: string | null;
  carModel: string | null;
  carColor: string | null;
  licensePlate: string | null;
  role: string;
}

export default function CompleteRegistrationPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const roleRaw = localStorage.getItem('role');
  const role = roleRaw as AppRole | null;

  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [carBrand, setCarBrand] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carColor, setCarColor] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    if (!token || !role) return;

    let cancelled = false;
    void (async () => {
      try {
        const { data } = await api.get<AuthMe>('/auth/me');
        if (cancelled) return;
        setPhoneNumber(data.phoneNumber ?? '');

        const realName =
          data.name?.trim() && data.name.trim() !== data.phoneNumber ? data.name.trim() : '';
        setName(sanitizeNameUa(realName));

        if (role === 'Driver') {
          setCarBrand(data.carBrand?.trim() ?? '');
          setCarModel(data.carModel?.trim() ?? '');
          setCarColor(data.carColor?.trim() ?? '');
          setLicensePlate(data.licensePlate?.trim() ?? '');
        }
      } catch {
      } finally {
        if (!cancelled) setProfileLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, role]);

  if (!token || !role) {
    return <Navigate to="/login" replace />;
  }

  const isDriver = role === 'Driver';
  const isManagerOrAdmin = role === 'Manager' || role === 'SuperAdmin';
  const roleLabel = role === 'SuperAdmin' ? 'Адміністратор' : role === 'Manager' ? 'Менеджер' : 'Водій';

  const plateOk = LICENSE_PLATE_REGEX.test(licensePlate.trim());
  const normalizedPhoneDigits = phoneNumber.replace(DIGITS_ONLY_REGEX, '');
  const phoneDigitsLocal = normalizedPhoneDigits.startsWith('380')
    ? normalizedPhoneDigits.slice(3, 12)
    : normalizedPhoneDigits.slice(-9);
  const phoneReady = phoneDigitsLocal.length === 9;

  const adminFormComplete = name.trim().length > 0;

  const driverFormComplete =
    name.trim().length > 0 &&
    carBrand.trim().length > 0 &&
    carModel.trim().length > 0 &&
    carColor.trim().length > 0 &&
    licensePlate.trim().length === 8 &&
    plateOk;

  const canSubmit = isDriver ? driverFormComplete : isManagerOrAdmin ? adminFormComplete : false;
  const completedFields = isDriver
    ? [
        phoneReady,
        name.trim().length > 0,
        carBrand.trim().length > 0,
        carModel.trim().length > 0,
        carColor.trim().length > 0,
        licensePlate.trim().length === 8 && plateOk
      ].filter(Boolean).length
    : isManagerOrAdmin
      ? [phoneReady, name.trim().length > 0].filter(Boolean).length
      : 0;
  const totalFields = isDriver ? 6 : isManagerOrAdmin ? 2 : 0;
  const formProgressPercent = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
  const cardClass = 'rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8';
  const fieldLabelClass = 'mb-2 block text-sm font-medium text-slate-300';
  const errorBoxClass = 'field-error-box';
  const hintTextClass = 'mt-1 text-xs text-slate-400';
  const primaryButtonClass =
    'manager-accent-glow manager-primary-btn mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-[#EAB308] px-4 py-3 text-sm font-semibold text-[#0F172A] transition-[filter,box-shadow,opacity] duration-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none';
  const statCardClass = 'rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl sm:p-5';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setError('');
    setLoading(true);
    try {
      if (isDriver) {
        await api.post('/auth/complete-registration', {
          name: name.trim(),
          carBrand: carBrand.trim(),
          carModel: carModel.trim(),
          carColor: carColor.trim(),
          licensePlate: licensePlate.trim().toLocaleUpperCase('uk-UA'),
        });
      } else {
        await api.post('/auth/complete-registration', {
          name: name.trim(),
        });
      }

      sessionStorage.removeItem('registrationPending');
      navigate(role === 'Manager' || role === 'SuperAdmin' ? '/manager/whitelist' : '/driver/dashboard', {
        replace: true,
      });
    } catch {
      setError('Не вдалося зберегти. Спробуйте ще раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0F172A] lg:flex">
      <AuthBackgroundLayers />

      <div className="relative z-[1] flex min-h-[100dvh] w-full flex-col items-center justify-center px-6 py-8 sm:px-8 lg:min-h-screen lg:w-1/2 lg:py-12">
        <div className="w-full max-w-lg">
          <div className="mb-6 flex flex-col items-center gap-3">
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="login-accent-glow flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EAB308] hover:brightness-105"
                aria-label="Перейти на сторінку входу"
              >
                <Car className="h-7 w-7 text-[#0F172A]" />
              </button>
              <h1 className="text-left text-5xl font-bold tracking-tight text-white">
                TAXI <span className="text-[#EAB308]">839</span>
              </h1>
            </div>
            <p className="text-center text-sm text-slate-400">Заповніть профіль, щоб завершити вхід у систему.</p>
          </div>

          <div className={cardClass}>
            <h2 className="mb-6 text-2xl font-semibold text-white">Завершення реєстрації</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={fieldLabelClass}>Номер телефону</label>
                {profileLoaded ? (
                  <div className="manager-phone-field mt-2 opacity-60">
                    <span className="manager-phone-field__prefix">+380</span>
                    <input
                      type="text"
                      disabled
                      value={phoneDigitsLocal}
                      placeholder="XXXXXXXXX"
                      className="manager-phone-field__input"
                    />
                  </div>
                ) : (
                  <div className="pointer-events-none manager-phone-field mt-2 select-none opacity-60" aria-busy>
                    <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center px-4">
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" aria-hidden />
                    </div>
                  </div>
                )}
              </div>

              <label className={fieldLabelClass}>
                Ім&apos;я
                <input
                  required
                  autoFocus={name.length === 0}
                  value={name}
                  onChange={(e) => {
                    const nextName = sanitizeNameUa(e.target.value);
                    setName(nextName);
                    if (nextName.trim()) setError('');
                  }}
                  className="mt-2 field-input"
                  placeholder="Олексій"
                />
                <p className={hintTextClass}>Українською (кирилиця)</p>
              </label>

              {isDriver ? (
                <>
                  <label className={fieldLabelClass}>
                    Марка авто
                    <input
                      required
                      value={carBrand}
                      lang="en"
                      onChange={(e) => setCarBrand(sanitizeCarBrandOrModel(e.target.value))}
                      className="mt-2 field-input"
                      placeholder="Toyota"
                    />
                    <p className={hintTextClass}>Англійською (латиниця)</p>
                  </label>
                  <label className={fieldLabelClass}>
                    Модель авто
                    <input
                      required
                      value={carModel}
                      lang="en"
                      onChange={(e) => setCarModel(sanitizeCarBrandOrModel(e.target.value))}
                      className="mt-2 field-input"
                      placeholder="Camry"
                    />
                    <p className={hintTextClass}>Англійською (латиниця)</p>
                  </label>
                  <label className={fieldLabelClass}>
                    Колір авто
                    <input
                      required
                      value={carColor}
                      lang="uk"
                      onChange={(e) => setCarColor(sanitizeCarColorUa(e.target.value))}
                      className="mt-2 field-input"
                      placeholder="Чорний"
                    />
                    <p className={hintTextClass}>Українською (кирилиця)</p>
                  </label>
                  <label className={fieldLabelClass}>
                    Номер авто
                    <input
                      required
                      value={licensePlate}
                      onChange={(e) => {
                        const v = formatLicensePlateInput(e.target.value);
                        setLicensePlate(v);
                      }}
                      maxLength={8}
                      inputMode="text"
                      className="mt-2 field-input"
                      placeholder="BC9193OB"
                    />
                    <p className={hintTextClass}>Формат: 2 літери, 4 цифри, 2 літери</p>
                  </label>
                </>
              ) : null}

              {error ? <div className={errorBoxClass}>{error}</div> : null}

              <button
                type="submit"
                disabled={loading || !canSubmit}
                className={`${primaryButtonClass} relative disabled:opacity-100`}
              >
                <span className={`inline-flex items-center gap-2 ${loading ? 'invisible' : ''}`}>
                  <Save className="h-5 w-5" />
                  Зберегти і продовжити
                  <ArrowRight className="h-5 w-5" />
                </span>
                {loading ? (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </span>
                ) : null}
              </button>
            </form>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-5 sm:grid-cols-2">
            <div className={statCardClass}>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <div>
                  <p className="flex min-h-9 items-center text-2xl font-bold leading-snug text-white">
                    {profileLoaded ? roleLabel : <Loader2 className="h-6 w-6 animate-spin" />}
                  </p>
                  <p className="mt-1 flex min-h-5 items-center text-sm leading-snug text-slate-400">
                    Роль профілю
                  </p>
                </div>
              </div>
            </div>
            <div className={statCardClass}>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
                  <Gauge className="h-7 w-7" />
                </div>
                <div>
                  <p className="flex min-h-9 items-center text-2xl font-bold tabular-nums text-white">
                    {profileLoaded ? `${formProgressPercent}%` : <Loader2 className="h-6 w-6 animate-spin" />}
                  </p>
                  <p className="mt-1 flex min-h-5 items-center text-sm leading-snug text-slate-400">
                    Готовність профілю
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs leading-snug text-slate-500">© 2026 TAXI 839. Всі права захищені.</p>
        </div>
      </div>

      <div className="relative z-[1] hidden min-h-screen w-1/2 flex-col lg:flex">
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-visible p-6 sm:p-10">
          <div className="relative aspect-square w-full max-w-lg min-h-[280px] max-h-[min(72vh,520px)] overflow-visible">
            <div className="absolute left-1/2 top-1/2 z-[3] h-[76%] w-[76%] -translate-x-1/2 -translate-y-1/2" aria-hidden>
              <div className="login-taxi-glow h-full w-full rounded-full" />
            </div>
            <div className="absolute inset-0 z-[4] flex items-center justify-center">
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
