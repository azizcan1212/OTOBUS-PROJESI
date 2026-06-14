import { Search, X } from 'lucide-react';

interface BusSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
  totalCount: number;
  isRefreshing?: boolean;
}

export function BusSearchBar({
  value,
  onChange,
  resultCount,
  totalCount,
  isRefreshing = false,
}: BusSearchBarProps) {
  return (
    <div className="mb-6 bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 backdrop-blur-sm">
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div className="flex-1">
          <label htmlFor="bus-search" className="text-slate-300 text-sm font-medium block mb-2">
            Hizli Bus Arama
          </label>
          <div className="relative">
            <Search size={18} className="text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              id="bus-search"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder="Fleet code, line code, rota, durak veya durum ara..."
              className="w-full bg-slate-900/70 border border-slate-700/60 rounded-xl pl-11 pr-11 py-3 text-slate-100 placeholder:text-slate-500 focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20 outline-none transition-all"
            />
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-100 transition-colors"
                aria-label="Aramayi temizle"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/50 min-w-[180px]">
            <p className="text-slate-500 text-xs uppercase tracking-[0.2em]">Search Result</p>
            <p className="text-slate-100 text-lg font-semibold mt-1">
              {resultCount} / {totalCount}
            </p>
          </div>

          <div className="px-4 py-3 rounded-xl bg-sky-500/10 border border-sky-500/20 min-w-[150px]">
            <p className="text-sky-300 text-xs uppercase tracking-[0.2em]">Data Mode</p>
            <p className="text-slate-100 text-sm font-medium mt-1">
              {isRefreshing ? 'Refreshing...' : 'Spring API + PostgreSQL'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
