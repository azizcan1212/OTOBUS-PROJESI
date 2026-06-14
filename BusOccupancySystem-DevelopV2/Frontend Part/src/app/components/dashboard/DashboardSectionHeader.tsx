import { Wifi } from 'lucide-react';

interface LegendItem {
  color: string;
  label: string;
}

interface DashboardSectionHeaderProps {
  totalBuses: number;
  legend: LegendItem[];
}

export function DashboardSectionHeader({ totalBuses, legend }: DashboardSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
      <div className="flex items-center gap-3">
        <Wifi size={16} className="text-blue-400" />
        <h2 className="text-slate-200" style={{ fontSize: '1.05rem', fontWeight: 600 }}>
          Live Fleet Snapshot
        </h2>
        <span className="text-xs text-slate-500 bg-slate-800 border border-slate-700 rounded-full px-2.5 py-0.5">
          {totalBuses} buses
        </span>
      </div>

      <div className="flex items-center gap-5">
        {legend.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-slate-500 text-xs">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
