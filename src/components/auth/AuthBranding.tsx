import { Car } from 'lucide-react';

interface AuthBrandingProps {
  tagline: string;
  onLogoClick?: () => void;
}

export function AuthBranding({ tagline, onLogoClick }: AuthBrandingProps) {
  const logoClass = onLogoClick
    ? 'login-accent-glow flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EAB308] hover:brightness-105'
    : 'login-accent-glow flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EAB308]';

  const logo = (
    <div className={logoClass}>
      <Car className="h-7 w-7 text-[#0F172A]" />
    </div>
  );

  return (
    <div className="mb-6 flex flex-col items-center gap-3">
      <div className="flex items-center justify-center gap-4">
        {onLogoClick ? (
          <button type="button" onClick={onLogoClick} aria-label="Перейти на сторінку входу">
            {logo}
          </button>
        ) : (
          logo
        )}
        <h1 className="text-left text-5xl font-bold tracking-tight text-white">
          TAXI <span className="text-[#EAB308]">839</span>
        </h1>
      </div>
      <p className="text-center text-sm text-slate-400">{tagline}</p>
    </div>
  );
}
