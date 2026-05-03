import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Car, Loader2 } from 'lucide-react';
import { api } from '../api/axios';
import type { AppRole } from '../utils/auth';
import { sanitizeCarBrandOrModel, sanitizeCarColorUa } from '../utils/carFields';
import { LICENSE_PLATE_REGEX } from '../utils/licensePlate';

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

        const realName =
          data.name?.trim() && data.name.trim() !== data.phoneNumber ? data.name.trim() : '';
        setName(realName);

        if (role === 'Driver') {
          setCarBrand(data.carBrand?.trim() ?? '');
          setCarModel(data.carModel?.trim() ?? '');
          setCarColor(data.carColor?.trim() ?? '');
          setLicensePlate(data.licensePlate?.trim() ?? '');
        }
      } catch {
        /* префіл необов’язковий */
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

  const plateOk = LICENSE_PLATE_REGEX.test(licensePlate.trim());

  const adminFormComplete = name.trim().length > 0;

  const driverFormComplete =
    name.trim().length > 0 &&
    carBrand.trim().length > 0 &&
    carModel.trim().length > 0 &&
    carColor.trim().length > 0 &&
    licensePlate.trim().length === 8 &&
    plateOk;

  const canSubmit = isDriver ? driverFormComplete : isManagerOrAdmin ? adminFormComplete : false;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

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
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-950 p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400">
            <Car className="h-5 w-5 text-gray-950" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Taxi 839</span>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h1 className="text-lg font-semibold text-white">Завершення реєстрації</h1>
          <p className="mt-2 text-sm text-gray-400">
            Заповніть профіль {isDriver ? 'водія' : 'менеджера'}, щоб продовжити роботу в системі.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block text-sm text-gray-300">
              Ім’я
              <input
                required
                autoFocus={!profileLoaded || name.length === 0}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (e.target.value.trim()) setError('');
                }}
                className="mt-1 field-input py-2.5"
                placeholder="Олексій"
              />
              <p className="mt-1 text-xs text-yellow-400">Українською (кирилиця)</p>
            </label>

            {isDriver && (
              <>
                <label className="block text-sm text-gray-300">
                  Марка авто
                  <input
                    required
                    value={carBrand}
                    lang="en"
                    onChange={(e) => setCarBrand(sanitizeCarBrandOrModel(e.target.value))}
                    className="mt-1 field-input py-2.5"
                    placeholder="Toyota"
                  />
                  <p className="mt-1 text-xs text-yellow-400">Англійською (латиниця)</p>
                </label>
                <label className="block text-sm text-gray-300">
                  Модель авто
                  <input
                    required
                    value={carModel}
                    lang="en"
                    onChange={(e) => setCarModel(sanitizeCarBrandOrModel(e.target.value))}
                    className="mt-1 field-input py-2.5"
                    placeholder="Camry"
                  />
                  <p className="mt-1 text-xs text-yellow-400">Англійською (латиниця)</p>
                </label>
                <label className="block text-sm text-gray-300">
                  Колір авто
                  <input
                    required
                    value={carColor}
                    lang="uk"
                    onChange={(e) => setCarColor(sanitizeCarColorUa(e.target.value))}
                    className="mt-1 field-input py-2.5"
                    placeholder="Чорний"
                  />
                  <p className="mt-1 text-xs text-yellow-400">Українською (кирилиця)</p>
                </label>
                <label className="block text-sm text-gray-300">
                  Номер авто
                  <input
                    required
                    value={licensePlate}
                    onChange={(e) => {
                      const v = e.target.value
                        .replace(/[^\d\p{L}]/gu, '')
                        .toLocaleUpperCase('uk-UA')
                        .slice(0, 8);
                      setLicensePlate(v);
                    }}
                    maxLength={8}
                    inputMode="text"
                    className="mt-1 field-input py-2.5"
                    placeholder="BC9193OB"
                  />
                  <p className="mt-1 text-xs text-yellow-400">Формат: 2 літери, 4 цифри, 2 літери</p>
                </label>
              </>
            )}

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="w-full rounded-lg bg-yellow-400 px-3 py-2.5 text-sm font-semibold text-gray-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Збереження...
                </span>
              ) : (
                'Зберегти'
              )}
            </button>
          </form>
        </div>

        <p className="mt-10 text-center text-xs text-gray-500">
          © 2026 Taxi 839. Всі права захищені.
        </p>
      </div>
    </div>
  );
}
