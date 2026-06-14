import type { DailyStatisticsPoint } from '../../types/statistics';

interface StatisticsDailyBarChartProps {
  points: DailyStatisticsPoint[];
  title: string;
  description: string;
}

export function StatisticsDailyBarChart({ points, title, description }: StatisticsDailyBarChartProps) {
  if (points.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-slate-700 bg-slate-950/35 p-8 text-slate-400 text-sm">
        Gunluk yogunluk karsilastirmasi icin yeterli veri yok.
      </div>
    );
  }

  const maxPassenger = Math.max(...points.map((point) => point.averagePassengerCount), 1);

  return (
    <div className="rounded-[2rem] border border-slate-700/50 bg-slate-950/45 p-5">
      <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-slate-100 text-lg font-semibold">{title}</p>
          <p className="text-slate-500 text-sm">{description}</p>
        </div>
        <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
          Sutun grafik
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {points.map((point) => (
          <div key={point.date} className="rounded-2xl border border-slate-700/40 bg-slate-900/55 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-slate-100 text-sm font-semibold">{point.label}</p>
              <span className="text-xs text-slate-500">{point.sampleCount} sample</span>
            </div>

            <div className="mt-4 h-28 rounded-2xl bg-slate-950/70 border border-slate-800/80 px-3 py-3 flex items-end">
              <div
                className="w-full rounded-xl bg-gradient-to-t from-amber-400 via-amber-300 to-yellow-200"
                style={{ height: `${Math.max((point.averagePassengerCount / maxPassenger) * 100, 6)}%` }}
              />
            </div>

            <div className="mt-3 space-y-1 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Ort. yolcu</span>
                <span className="text-slate-100 font-semibold">{point.averagePassengerCount}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Ort. doluluk</span>
                <span className="text-amber-300 font-semibold">{point.averageOccupancyRate}%</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Pik yolcu</span>
                <span className="text-cyan-300 font-semibold">{point.peakPassengerCount}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
