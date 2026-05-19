import { Construction } from 'lucide-react';
import { PAGE_CARD_CLASS } from '../../styles/pageClasses';

export default function DevelopmentPage() {
  return (
    <section className={PAGE_CARD_CLASS}>
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
