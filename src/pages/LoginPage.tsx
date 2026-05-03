import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ShieldCheck, ArrowRight, Loader2, ChevronLeft, Car } from 'lucide-react';
import { api } from '../api/axios';

type Step = 'phone' | 'otp';

export default function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('phone');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [digits, setDigits] = useState('');
  const phone = `+380${digits}`;
  const isPhoneValid = digits.length === 9;

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
    <div className="min-h-screen w-full bg-gray-950 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gray-900 border-r border-gray-800 p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400">
            <Car className="h-5 w-5 text-gray-950" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Taxi 839</span>
        </div>

        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2">
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-400" />
            </span>
            <span className="text-sm font-medium text-yellow-400">Онлайн</span>
          </div>
          <h1 className="text-5xl font-black leading-tight tracking-tight text-white">
            Платформа для<br />
            <span className="text-yellow-400">водіїв та менеджерів</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-sm">
            Таксі - це просто, зручно і надійно.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Активних водіїв', value: '—' },
            { label: 'Поїздок сьогодні', value: '—' },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-800/60 rounded-2xl p-4 border border-gray-700/50">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-gray-400 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md animate-slide-up">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400">
              <Car className="h-5 w-5 text-gray-950" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Taxi 839</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">
              {step === 'phone' ? 'Вхід до системи' : 'Підтвердження'}
            </h2>
            <p className="text-gray-400 mt-2 text-sm">
              {step === 'phone'
                ? 'Введіть номер телефону, який зареєстровано у системі.'
                : `Введіть код, надісланий на ${phone}.`}
            </p>
          </div>

          {step === 'phone' ? (
            <form onSubmit={handleSendCode} className="space-y-4 animate-fade-in">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Номер телефону</label>
                <div className="phone-field-wrap overflow-hidden rounded-xl">
                  <div className="flex items-center gap-2 pl-4 pr-3 border-r border-gray-700 shrink-0">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-300 text-sm font-medium">+380</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="XXXXXXXXX"
                    value={digits}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 9) {
                        setDigits(val);
                        if (val.length === 0) setError('');
                      }
                    }}
                    required
                    className="flex-1 bg-transparent text-white placeholder-gray-600 px-4 py-3.5 text-sm outline-none min-w-0"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !isPhoneValid}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 py-3.5 text-sm font-semibold text-gray-950 transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Надіслати код
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4 animate-fade-in">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Код підтвердження</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <ShieldCheck className="w-4 h-4 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    maxLength={6}
                    value={code}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setCode(val);
                      if (val.length === 0) setError('');
                    }}
                    required
                    autoFocus
                    className="field-input !rounded-xl py-3.5 pl-11 pr-4 font-mono tracking-[0.4em] text-center placeholder:text-gray-500"
                  />
                </div>
                <p className="text-xs text-gray-500 text-center pt-1">
                  Код дійсний протягом 5 хвилин.
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 py-3.5 text-sm font-semibold text-gray-950 transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Увійти
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setStep('phone'); setCode(''); setError(''); setDigits(''); }}
                className="w-full flex items-center justify-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm transition-colors py-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Змінити номер
              </button>
            </form>
          )}

          <p className="text-center text-gray-500 text-xs mt-10">
            © 2026 Taxi 839. Всі права захищені.
          </p>
        </div>
      </div>
    </div>
  );
}
