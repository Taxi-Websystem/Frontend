import type { ReactNode } from 'react';
import AuthBackgroundLayers from '../AuthBackgroundLayers';
import AuthHeroIllustration from '../AuthHeroIllustration';

interface AuthPageLayoutProps {
  children: ReactNode;
}

export function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0F172A] lg:flex">
      <AuthBackgroundLayers />
      <div className="relative z-[1] flex min-h-[100dvh] w-full flex-col items-center justify-center px-6 py-8 sm:px-8 lg:min-h-screen lg:w-1/2 lg:py-12">
        <div className="w-full max-w-lg">
          {children}
          <p className="mt-6 text-center text-xs leading-snug text-slate-500">© 2026 TAXI 839. Всі права захищені.</p>
        </div>
      </div>
      <AuthHeroIllustration />
    </div>
  );
}
