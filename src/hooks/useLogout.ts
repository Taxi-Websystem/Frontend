import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import { clearAuth } from '../utils/auth';

export function useLogout() {
  const navigate = useNavigate();

  return async () => {
    try {
      await api.post('/presence/logout');
    } catch {
    } finally {
      clearAuth();
      navigate('/login', { replace: true });
    }
  };
}
