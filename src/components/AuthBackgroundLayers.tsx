/**
 * Статичний фон (лише CSS-градієнти, без окремих «плям»/blobs у DOM).
 */
export default function AuthBackgroundLayers() {
  return (
    <div
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_95%_75%_at_50%_50%,rgba(234,179,8,0.06),transparent_58%),radial-gradient(ellipse_100%_80%_at_50%_100%,rgba(15,23,42,0.45),transparent_55%)]"
      aria-hidden
    />
  );
}
