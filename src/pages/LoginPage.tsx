import { PAGE_CARD_CLASS } from '../styles/pageClasses';
import { AuthBranding } from '../components/auth/AuthBranding';
import { AuthPageLayout } from '../components/auth/AuthPageLayout';
import { LoginOtpForm } from './login/LoginOtpForm';
import { LoginPhoneForm } from './login/LoginPhoneForm';
import { LoginPublicStatsCards } from './login/LoginPublicStatsCards';
import { useLoginPage } from './login/useLoginPage';

export default function LoginPage() {
  const login = useLoginPage();

  return (
    <AuthPageLayout>
      <AuthBranding tagline="Таксі - це просто, зручно та швидко." />

      <div className={PAGE_CARD_CLASS}>
        <h2 className="mb-6 text-2xl font-semibold text-white">
          {login.step === 'phone' ? 'Вхід до системи' : 'Підтвердження'}
        </h2>

        {login.step === 'phone' ? (
          <LoginPhoneForm
            digits={login.digits}
            error={login.error}
            loading={login.loading}
            isPhoneValid={login.isPhoneValid}
            onSubmit={login.handleSendCode}
            onDigitsChange={login.handlePhoneInputChange}
          />
        ) : (
          <LoginOtpForm
            code={login.code}
            error={login.error}
            loading={login.loading}
            onSubmit={login.handleVerifyCode}
            onCodeChange={login.handleOtpInputChange}
            onBackToPhone={login.resetToPhoneStep}
          />
        )}
      </div>

      <LoginPublicStatsCards loading={login.publicStatsLoading} stats={login.publicStats} />
    </AuthPageLayout>
  );
}
