import { Construction } from 'lucide-react';

export default function DevelopmentPage() {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
          <Construction className="h-7 w-7" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">У розробці</h2>
          <p className="mt-2 text-sm text-slate-400">Цей розділ буде реалізовано в наступних версіях.</p>
        </div>
      </div>
    </section>
  );
}
