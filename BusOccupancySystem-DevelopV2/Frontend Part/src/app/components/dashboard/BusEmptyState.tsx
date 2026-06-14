import { SearchX } from 'lucide-react';

interface BusEmptyStateProps {
  query: string;
}

export function BusEmptyState({ query }: BusEmptyStateProps) {
  return (
    <div className="bg-slate-800/55 border border-slate-700/50 rounded-3xl p-8 text-center backdrop-blur-sm">
      <div className="w-14 h-14 rounded-2xl bg-slate-700/60 border border-slate-600/60 mx-auto flex items-center justify-center mb-4">
        <SearchX size={22} className="text-slate-300" />
      </div>
      <h3 className="text-slate-100 text-lg font-semibold">Eslesen otobus bulunamadi</h3>
      <p className="text-slate-400 text-sm mt-2">
        <span className="text-slate-200">&quot;{query}&quot;</span> icin sonuc cikmadi. Fleet code, line code, rota
        veya durak bilgisiyle tekrar deneyebilirsin.
      </p>
    </div>
  );
}
