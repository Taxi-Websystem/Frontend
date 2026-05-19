import { Loader2 } from 'lucide-react';

export function ManagerTableLoading() {
  return (
    <div className="text-center text-slate-400">
      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
    </div>
  );
}
