import type { DailyStatisticsPoint } from '../../types/statistics';

interface StatisticsDailyLineChartProps {
  points: DailyStatisticsPoint[];
}

function createLinePath(values: number[], width: number, height: number, paddingX: number, paddingY: number, maxValue: number) {
  if (values.length === 0) {
    return '';
  }

  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingY * 2;

  return values
    .map((value, index) => {
      const x = paddingX + (usableWidth * index) / Math.max(values.length - 1, 1);
      const y = paddingY + usableHeight - (value / Math.max(maxValue, 1)) * usableHeight;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function createAreaPath(values: number[], width: number, height: number, paddingX: number, paddingY: number, maxValue: number) {
  if (values.length === 0) {
    return '';
  }

  const linePath = createLinePath(values, width, height, paddingX, paddingY, maxValue);
  const usableWidth = width - paddingX * 2;
  const baseY = height - paddingY;

  return `${linePath} L ${(paddingX + usableWidth).toFixed(2)} ${baseY.toFixed(2)} L ${paddingX.toFixed(
    2,
  )} ${baseY.toFixed(2)} Z`;
}

export function StatisticsDailyLineChart({ points }: StatisticsDailyLineChartProps) {
  const width = 860;
  const height = 280;
  const paddingX = 46;
  const paddingY = 26;

  if (points.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-slate-700 bg-slate-950/35 p-8 text-slate-400 text-sm">
        Gunluk cizgi grafigi icin yeterli veri yok.
      </div>
    );
  }

  const values = points.map((point) => point.averagePassengerCount);
  const maxValue = Math.max(...values, 1);
  const linePath = createLinePath(values, width, height, paddingX, paddingY, maxValue);
  const areaPath = createAreaPath(values, width, height, paddingX, paddingY, maxValue);
  const labelStep = Math.max(Math.ceil(points.length / 6), 1);

  return (
    <div className="rounded-[2rem] border border-slate-700/50 bg-slate-950/45 p-5">
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-slate-100 text-lg font-semibold">Gun gun yolcu ortalamasi</p>
          <p className="text-slate-500 text-sm">Aylik veya secili donemde gunluk ortalama yolcu sayisini izler.</p>
        </div>
        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
          Cizgi grafik
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[720px] w-full h-auto">
          <defs>
            <linearGradient id="dailyPassengerAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#67e8f9" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {[0, 0.5, 1].map((ratio) => {
            const y = paddingY + (height - paddingY * 2) - ratio * (height - paddingY * 2);
            const tick = Math.round(maxValue * ratio);

            return (
              <g key={ratio}>
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="rgba(148,163,184,0.12)" />
                <text x={10} y={y + 4} fill="rgba(148,163,184,0.68)" fontSize="12">
                  {tick}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#dailyPassengerAreaGradient)" />
          <path d={linePath} fill="none" stroke="#67e8f9" strokeWidth="4" strokeLinecap="round" />

          {points.map((point, index) => {
            const usableWidth = width - paddingX * 2;
            const usableHeight = height - paddingY * 2;
            const x = paddingX + (usableWidth * index) / Math.max(points.length - 1, 1);
            const y = paddingY + usableHeight - (point.averagePassengerCount / maxValue) * usableHeight;

            return (
              <g key={point.date}>
                <circle cx={x} cy={y} r="5" fill="#67e8f9" stroke="#0f172a" strokeWidth="3" />
                {index % labelStep === 0 || index === points.length - 1 ? (
                  <text x={x} y={height - 8} textAnchor="middle" fill="rgba(226,232,240,0.78)" fontSize="12">
                    {point.label}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
