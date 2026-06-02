import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, getApiErrorMessage } from '../../../api/axios';
import { ORDER_CARD_CLASS } from '../../../styles/pageClasses';
import { sanitizeNameUa } from '../../../utils/nameFields';
import { RegistrationForm } from '../../completeRegistration/RegistrationForm';
import {
  type AuthMe,
  isDriverProfileFormValid
} from '../../completeRegistration/registrationHelpers';

export function PersonalInfoSettingsSection() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [carBrand, setCarBrand] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carColor, setCarColor] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [profileLoaded, setProfileLoaded] = useState(false);

  const loadProfile = useCallback(async () => {
    setError('');
    try {
      const { data } = await api.get<AuthMe>('/auth/me');
      setPhoneNumber(data.phoneNumber ?? '');

      const realName =
        data.name?.trim() && data.name.trim() !== data.phoneNumber ? data.name.trim() : '';
      setName(sanitizeNameUa(realName));
      setCarBrand(data.carBrand?.trim() ?? '');
      setCarModel(data.carModel?.trim() ?? '');
      setCarColor(data.carColor?.trim() ?? '');
      setLicensePlate(data.licensePlate?.trim() ?? '');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не вдалося завантажити профіль.'));
    } finally {
      setProfileLoaded(true);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const canSubmit =
    profileLoaded && isDriverProfileFormValid(name, carBrand, carModel, carColor, licensePlate);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || saving) return;

    setSaving(true);
    setError('');
    try {
      await api.post('/auth/complete-registration', {
        name: name.trim(),
        carBrand: carBrand.trim(),
        carModel: carModel.trim(),
        carColor: carColor.trim(),
        licensePlate: licensePlate.trim().toLocaleUpperCase('uk-UA')
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не вдалося зберегти профіль.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={ORDER_CARD_CLASS}>
      <h3 className="text-sm font-semibold text-white">Особиста інформація</h3>
      <p className="mt-1 text-xs text-slate-400">Ім&apos;я та дані про автомобіль.</p>

      <div className="mt-6">
        <RegistrationForm
          variant="settings"
          profileLoaded={profileLoaded}
          phoneNumber={phoneNumber}
          name={name}
          carBrand={carBrand}
          carModel={carModel}
          carColor={carColor}
          licensePlate={licensePlate}
          isDriver
          error={error}
          loading={saving}
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
          onSubmit={(event) => void handleSubmit(event)}
        />
      </div>
    </div>
  );
}
