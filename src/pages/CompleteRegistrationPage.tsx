import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import { getPostLoginPath, type AppRole } from '../utils/auth';
import { isUaPhoneLocalComplete, extractUaPhoneDigitsFromStoredValue } from '../utils/phone';
import { sanitizeNameUa } from '../utils/nameFields';
import { PAGE_CARD_CLASS } from '../styles/pageClasses';
import { AuthBranding } from '../components/auth/AuthBranding';
import { AuthPageLayout } from '../components/auth/AuthPageLayout';
import { RegistrationForm } from './completeRegistration/RegistrationForm';
import { RegistrationSideStats } from './completeRegistration/RegistrationSideStats';
import {
  getProfileProgress,
  getRegistrationRoleLabel,
  isDriverProfileFormValid,
  type AuthMe
} from './completeRegistration/registrationHelpers';
import { LICENSE_PLATE_REGEX } from '../utils/licensePlate';

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

    let isCancelled = false;
    void (async () => {
      try {
        const { data } = await api.get<AuthMe>('/auth/me');
        if (isCancelled) return;
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
        if (!isCancelled) setProfileLoaded(true);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [token, role]);

  if (!token || !role) {
    return <Navigate to="/login" replace />;
  }

  const isDriver = role === 'Driver';
  const isManagerOrAdmin = role === 'Manager' || role === 'SuperAdmin';
  const roleLabel = getRegistrationRoleLabel(role);

  const plateOk = LICENSE_PLATE_REGEX.test(licensePlate.trim());
  const phoneDigitsLocal = extractUaPhoneDigitsFromStoredValue(phoneNumber);
  const phoneReady = isUaPhoneLocalComplete(phoneDigitsLocal);

  const isNameFilled = name.trim().length > 0;
  const isCarBrandFilled = carBrand.trim().length > 0;
  const isCarModelFilled = carModel.trim().length > 0;
  const isCarColorFilled = carColor.trim().length > 0;
  const isLicensePlateValid = licensePlate.trim().length === 8 && plateOk;

  const driverFormComplete = isDriverProfileFormValid(
    name,
    carBrand,
    carModel,
    carColor,
    licensePlate
  );
  const adminFormComplete = isNameFilled;
  const canSubmit = isDriver ? driverFormComplete : isManagerOrAdmin ? adminFormComplete : false;

  const { completedFields, totalFields } = getProfileProgress(
    isDriver,
    isManagerOrAdmin,
    phoneReady,
    isNameFilled,
    isCarBrandFilled,
    isCarModelFilled,
    isCarColorFilled,
    isLicensePlateValid
  );
  const formProgressPercent = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
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
          licensePlate: licensePlate.trim().toLocaleUpperCase('uk-UA')
        });
      } else {
        await api.post('/auth/complete-registration', { name: name.trim() });
      }

      sessionStorage.removeItem('registrationPending');
      navigate(getPostLoginPath(role), { replace: true });
    } catch {
      setError('Не вдалося зберегти. Спробуйте ще раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout>
      <AuthBranding tagline="Заповніть профіль, щоб завершити вхід у систему." onLogoClick={() => navigate('/login')} />

      <div className={PAGE_CARD_CLASS}>
        <h2 className="mb-6 text-2xl font-semibold text-white">Завершення реєстрації</h2>
        <RegistrationForm
          profileLoaded={profileLoaded}
          phoneNumber={phoneNumber}
          name={name}
          carBrand={carBrand}
          carModel={carModel}
          carColor={carColor}
          licensePlate={licensePlate}
          isDriver={isDriver}
          error={error}
          loading={loading}
          canSubmit={canSubmit}
          onNameChange={(value) => {
            setName(value);
            if (value.trim()) setError('');
          }}
          onCarBrandChange={(next) => {
            setCarBrand(next);
            if (next.trim().toLowerCase() !== carBrand.trim().toLowerCase()) {
              setCarModel('');
            }
          }}
          onCarModelChange={setCarModel}
          onCarColorChange={setCarColor}
          onLicensePlateChange={setLicensePlate}
          onSubmit={handleSubmit}
        />
      </div>

      <RegistrationSideStats
        profileLoaded={profileLoaded}
        roleLabel={roleLabel}
        formProgressPercent={formProgressPercent}
      />
    </AuthPageLayout>
  );
}
