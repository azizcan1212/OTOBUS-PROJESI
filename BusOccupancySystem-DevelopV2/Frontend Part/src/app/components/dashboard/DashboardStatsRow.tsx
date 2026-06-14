import type { DashboardMetricWithIcon } from '../../utils/dashboard';
import { StatCard } from './StatCard';

interface DashboardStatsRowProps {
  metrics: DashboardMetricWithIcon[];
}

export function DashboardStatsRow({ metrics }: DashboardStatsRowProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      {metrics.map((metric) => (
        <StatCard
          key={metric.label}
          icon={metric.icon}
          label={metric.label}
          value={metric.value}
          sub={metric.sub}
          accent={metric.accent}
        />
      ))}
    </div>
  );
}
