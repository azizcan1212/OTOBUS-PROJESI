import type { StatusDistributionPoint } from '../../types/statistics';

interface StatisticsStatusDonutChartProps {
  points: StatusDistributionPoint[];
}

const STATUS_COLORS: Record<string, string> = {
  ON_TIME: '#34d399',
  DELAYED: '#fbbf24',
  OUT_OF_SERVICE: '#f87171',
};

export function StatisticsStatusDonutChart({ points }: StatisticsStatusDonutChartProps) {
  const total = points.reduce((sum, point) => sum + point.count, 0);
  const size = 220;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="rounded-[2rem] border border-slate-700/50 bg-slate-950/45 p-5">
      <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-slate-100 text-lg font-semibold">Canli operasyon dagilimi</p>
          <p className="text-slate-500 text-sm">Aktif fleet durumunu pasta grafik ile hizli ozetler.</p>
        </div>
        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
          Pasta grafik
        </span>
      </div>

      <div className="grid md:grid-cols-[220px_1fr] gap-6 items-center">
        <div className="relative mx-auto">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(71,85,105,0.35)"
              strokeWidth={strokeWidth}
            />

            {points.map((point) => {
              const ratio = total === 0 ? 0 : point.count / total;
              const segmentLength = circumference * ratio;
              const circle = (
                <circle
                  key={point.status}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={STATUS_COLORS[point.status] ?? '#94a3b8'}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                />
              );

              offset += segmentLength;
              return circle;
            })}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-slate-500 text-xs uppercase tracking-[0.18em]">Canli bus</p>
            <p className="text-slate-100 text-4xl font-semibold mt-2">{total}</p>
          </div>
        </div>

        <div className="space-y-3">
          {points.map((point) => (
            <div
              key={point.status}
              className="flex items-center justify-between gap-4 rounded-2xl border border-slate-700/40 bg-slate-900/55 p-4"
            >
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex h-3 w-3 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[point.status] ?? '#94a3b8' }}
                />
                <div>
                  <p className="text-slate-100 font-semibold">{point.label}</p>
                  <p className="text-slate-500 text-sm">{point.percentage}% oran</p>
                </div>
              </div>
              <span className="text-slate-100 text-lg font-semibold">{point.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
