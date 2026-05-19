export default function AuthHeroIllustration() {
  return (
    <div className="relative z-[1] hidden min-h-screen w-1/2 flex-col lg:flex">
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-visible p-6 sm:p-10">
        <div className="relative aspect-square w-full max-w-lg min-h-[280px] max-h-[min(72vh,520px)] overflow-visible">
          <div className="absolute left-1/2 top-1/2 z-[3] h-[76%] w-[76%] -translate-x-1/2 -translate-y-1/2" aria-hidden>
            <div className="login-taxi-glow h-full w-full rounded-full" />
          </div>
          <div className="absolute inset-0 z-[4] flex items-center justify-center">
            <svg
              className="h-[76%] w-[76%] max-h-[min(48vh,400px)] max-w-[min(48vh,400px)] text-[#EAB308] opacity-[0.42]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.32"
              aria-hidden
            >
              <path d="M8 6h8M6 10h12M3 14h18M5 18h14" />
              <rect x="4" y="8" width="16" height="10" rx="2" />
              <circle cx="7" cy="18" r="2" />
              <circle cx="17" cy="18" r="2" />
            </svg>
          </div>
          <svg
            className="pointer-events-none absolute inset-0 z-[2] h-full w-full"
            viewBox="0 0 800 800"
            fill="none"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden
          >
            <path
              className="login-route-line login-route-line--a"
              d="M 80 410 Q 240 190 400 410 T 720 410"
              stroke="#EAB308"
              strokeWidth="3"
            />
            <path
              className="login-route-line login-route-line--b"
              d="M 140 510 Q 300 290 460 510 T 760 510"
              stroke="#EAB308"
              strokeWidth="2.5"
            />
            <path
              className="login-route-line login-route-line--c"
              d="M 40 310 Q 220 90 380 310 T 680 310"
              stroke="#EAB308"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
