import type { HourlyOccupancyPoint } from '../../types/statistics';

interface StatisticsTrendChartProps {
  points: HourlyOccupancyPoint[];
}

function createLinePath(
  values: number[],
  width: number,
  height: number,
  paddingX: number,
  paddingY: number,
  maxValue: number,
) {
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

function createAreaPath(
  values: number[],
  width: number,
  height: number,
  paddingX: number,
  paddingY: number,
  maxValue: number,
) {
  if (values.length === 0) {
    return '';
  }

  const linePath = createLinePath(values, width, height, paddingX, paddingY, maxValue);
  const usableWidth = width - paddingX * 2;
  const baseY = height - paddingY;
  const lastX = paddingX + usableWidth;
  const firstX = paddingX;

  return `${linePath} L ${lastX.toFixed(2)} ${baseY.toFixed(2)} L ${firstX.toFixed(2)} ${baseY.toFixed(2)} Z`;
}

export function StatisticsTrendChart({ points }: StatisticsTrendChartProps) {
  const width = 880;
  const height = 320;
  const paddingX = 44;
  const paddingY = 28;

  if (points.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-slate-700 bg-slate-950/35 p-8 text-slate-400 text-sm">
        Grafik cizmek icin yeterli saatlik veri yok.
      </div>
    );
  }

  const occupancyValues = points.map((point) => point.averageOccupancyRate);
  const passengerValues = points.map((point) => point.averagePassengerCount);
  const sampleValues = points.map((point) => point.sampleCount);
  const maxPassengers = Math.max(...passengerValues, 1);
  const maxSamples = Math.max(...sampleValues, 1);

  const occupancyPath = createLinePath(occupancyValues, width, height, paddingX, paddingY, 100);
  const occupancyArea = createAreaPath(occupancyValues, width, height, paddingX, paddingY, 100);
  const passengerPath = createLinePath(passengerValues, width, height, paddingX, paddingY, maxPassengers);

  return (
    <div className="rounded-[2rem] border border-slate-700/50 bg-slate-950/45 p-5">
      <div className="flex items-center gap-5 flex-wrap mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          Doluluk orani
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-300" />
          Ortalama yolcu
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
          Sample yogunlugu
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[720px] w-full h-auto">
          <defs>
            <linearGradient id="occupancyAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fcd34d" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#fcd34d" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {[0, 25, 50, 75, 100].map((tick) => {
            const y = paddingY + (height - paddingY * 2) - ((height - paddingY * 2) * tick) / 100;

            return (
              <g key={tick}>
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="rgba(148,163,184,0.12)" />
                <text x={10} y={y + 4} fill="rgba(148,163,184,0.68)" fontSize="12">
                  {tick}%
                </text>
              </g>
            );
          })}

          {points.map((point, index) => {
            const usableWidth = width - paddingX * 2;
            const x = paddingX + (usableWidth * index) / Math.max(points.length - 1, 1);
            const barHeight = ((height - paddingY * 2) * point.sampleCount) / maxSamples;
            const barY = height - paddingY - barHeight;

            return (
              <g key={point.hour}>
                <rect
                  x={x - 10}
                  y={barY}
                  width="20"
                  height={barHeight}
                  rx="10"
                  fill="rgba(71,85,105,0.35)"
                />
                <text x={x} y={height - 6} textAnchor="middle" fill="rgba(226,232,240,0.78)" fontSize="12">
                  {String(point.hour).padStart(2, '0')}
                </text>
              </g>
            );
          })}

          <path d={occupancyArea} fill="url(#occupancyAreaGradient)" />
          <path d={occupancyPath} fill="none" stroke="#fcd34d" strokeWidth="4" strokeLinecap="round" />
          <path d={passengerPath} fill="none" stroke="#67e8f9" strokeWidth="3" strokeLinecap="round" strokeDasharray="8 8" />

          {points.map((point, index) => {
            const usableWidth = width - paddingX * 2;
            const usableHeight = height - paddingY * 2;
            const x = paddingX + (usableWidth * index) / Math.max(points.length - 1, 1);
            const occupancyY = paddingY + usableHeight - (point.averageOccupancyRate / 100) * usableHeight;
            const passengerY = paddingY + usableHeight - (point.averagePassengerCount / maxPassengers) * usableHeight;

            return (
              <g key={`${point.hour}-markers`}>
                <circle cx={x} cy={occupancyY} r="5" fill="#fcd34d" stroke="#0f172a" strokeWidth="3" />
                <circle cx={x} cy={passengerY} r="4.5" fill="#67e8f9" stroke="#0f172a" strokeWidth="3" />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
