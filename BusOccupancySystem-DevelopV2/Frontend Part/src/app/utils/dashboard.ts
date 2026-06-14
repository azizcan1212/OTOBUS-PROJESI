import { Activity, AlertTriangle, Bus, TrendingUp, Users } from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

import type { BusRecord } from '../types/bus';

interface DashboardMetric {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}

export interface DashboardMetricWithIcon extends DashboardMetric {
  icon: LucideIcon;
}

export function getDashboardMetrics(buses: BusRecord[]): DashboardMetricWithIcon[] {
  const active = buses.filter((bus) => bus.status !== 'OUT_OF_SERVICE').length;
  const averageCapacity = Math.round(
    buses.reduce((sum, bus) => sum + bus.occupancyRate, 0) / Math.max(buses.length, 1),
  );
  const totalPassengers = buses.reduce((sum, bus) => sum + bus.activePassengerCount, 0);
  const delayed = buses.filter((bus) => bus.status === 'DELAYED').length;

  return [
    {
      label: 'Fleet Size',
      value: `${buses.length}`,
      sub: `${active} active`,
      accent: 'bg-blue-500/20',
      icon: Bus,
    },
    {
      label: 'Avg Occupancy',
      value: `${averageCapacity}%`,
      sub: 'across all routes',
      accent: 'bg-violet-500/20',
      icon: Activity,
    },
    {
      label: 'Total Passengers',
      value: `${totalPassengers}`,
      sub: `of ${buses.reduce((sum, bus) => sum + bus.maxCapacity, 0)} capacity`,
      accent: 'bg-cyan-500/20',
      icon: Users,
    },
    {
      label: 'On Schedule',
      value: `${active - delayed}/${active}`,
      sub: 'buses on time',
      accent: 'bg-emerald-500/20',
      icon: TrendingUp,
    },
    {
      label: 'Alerts',
      value: `${delayed}`,
      sub: 'delayed routes',
      accent: delayed > 0 ? 'bg-amber-500/20' : 'bg-slate-700/50',
      icon: AlertTriangle,
    },
  ];
}

export const BUS_LEGEND = [
  { color: '#64748b', label: 'Empty' },
  { color: '#22c55e', label: 'Low <=40%' },
  { color: '#f59e0b', label: 'Moderate <=70%' },
  { color: '#ef4444', label: 'High >70%' },
];
