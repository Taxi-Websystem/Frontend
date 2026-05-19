import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/axios';
import { getPostLoginPath } from '../../utils/auth';
import { formatUaPhoneE164, isUaPhoneLocalComplete, parseUaPhoneDigitsInput } from '../../utils/phone';
import { DIGITS_ONLY_REGEX } from '../../utils/regex';
import type { LoginPublicStats, LoginStep } from './loginTypes';

export function useLoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<LoginStep>('phone');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [publicStats, setPublicStats] = useState<LoginPublicStats | null>(null);
  const [publicStatsLoading, setPublicStatsLoading] = useState(true);
  const [digits, setDigits] = useState('');

  const phone = formatUaPhoneE164(digits);
  const isPhoneValid = isUaPhoneLocalComplete(digits);

  const refreshPublicStats = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setPublicStatsLoading(true);
    }
    try {
      const { data } = await api.get<LoginPublicStats>('/auth/public-stats');
      setPublicStats(data);
    } catch {
      setPublicStats(null);
    } finally {
      if (showLoading) {
        setPublicStatsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refreshPublicStats();
    const intervalId = window.setInterval(() => {
      void refreshPublicStats(false);
    }, 30000);
    return () => window.clearInterval(intervalId);
  }, [refreshPublicStats]);

  const handleSendCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/send-code', { phoneNumber: phone });
      setStep('otp');
    } catch (err: unknown) {
      const apiErrorData = (err as { response?: { data?: { code?: string } } })?.response?.data;
      if (apiErrorData?.code === 'INACTIVE') {
        setError('Обліковий запис деактивовано. Зверніться до підтримки.');
      } else {
        setError('Номер не зареєстрований у системі.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post<{ token: string; role: string; requiresRegistration?: boolean }>(
        '/auth/verify-code',
        { phoneNumber: phone, code }
      );
      const { token, role, requiresRegistration } = data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      if (requiresRegistration) {
        sessionStorage.setItem('registrationPending', 'true');
        navigate('/complete-registration', { replace: true });
      } else {
        navigate(getPostLoginPath(role), { replace: true });
      }
    } catch {
      setError('Невірний або прострочений код підтвердження.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedPhoneDigits = parseUaPhoneDigitsInput(event.target.value);
    if (sanitizedPhoneDigits.length <= 9) {
      setDigits(sanitizedPhoneDigits);
      if (sanitizedPhoneDigits.length === 0) {
        setError('');
      }
    }
  };

  const handleOtpInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedOtpCode = event.target.value.replace(DIGITS_ONLY_REGEX, '');
    setCode(sanitizedOtpCode);
    if (sanitizedOtpCode.length === 0) {
      setError('');
    }
  };

  const resetToPhoneStep = () => {
    setStep('phone');
    setCode('');
    setError('');
    setDigits('');
  };

  return {
    step,
    code,
    error,
    loading,
    publicStats,
    publicStatsLoading,
    digits,
    isPhoneValid,
    handleSendCode,
    handleVerifyCode,
    handlePhoneInputChange,
    handleOtpInputChange,
    resetToPhoneStep
  };
}
