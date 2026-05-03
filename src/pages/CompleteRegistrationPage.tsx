import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Car, Loader2 } from 'lucide-react';
import { api } from '../api/axios';

export default function CompleteRegistrationPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token || !role) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Вкажіть ім'я.");
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/complete-registration', { name: trimmed });
      navigate(role === 'Manager' || role === 'SuperAdmin' ? '/manager/whitelist' : '/driver/dashboard', {
        replace: true
      });
    } catch {
      setError('Не вдалося зберегти. Спробуйте ще раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500">
          <Car className="h-5 w-5 text-gray-950" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">Taxi 839</span>
      </div>

      <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h1 className="text-lg font-semibold text-white">Завершення реєстрації</h1>
        <p className="mt-2 text-sm text-gray-400">
          Введіть ваше ім’я, щоб продовжити роботу в системі.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm text-gray-300">
            Ім’я
            <input
              required
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.trim()) setError('');
              }}
              className="mt-1 field-input py-2.5"
              placeholder="Наприклад, Олексій"
            />
          </label>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full rounded-lg bg-yellow-500 px-3 py-2.5 text-sm font-semibold text-gray-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Збереження...
              </span>
            ) : (
              'Продовжити'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
