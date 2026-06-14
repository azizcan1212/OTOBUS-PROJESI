import { Activity, Clock3, MapPin, Users } from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

import type { BusRecord } from '../types/bus';
import { getCapacityInfo } from './capacity';
import { getOperationalStatusTag, getOperationalStatusTone, getStatusAccent, getStatusLabel } from './busPresentation';

interface DetailMetric {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}

export interface OperationalRow {
  label: string;
  value: string;
  tag: string;
  tone: string;
}

export function getBusServiceSummary(bus: BusRecord) {
  if (bus.status === 'DELAYED') {
    return `${bus.lineCode} hatti gecikmeli ilerliyor ve ${bus.destination} yonunde ${bus.delayInMinutes ?? 0} dakika sapma tasiyor`;
  }

  if (bus.status === 'OUT_OF_SERVICE') {
    return `${bus.lineCode} araci aktif filoda degil ve servis donusu icin hazirlaniyor`;
  }

  return `${bus.lineCode} hatti planlanan servis akisi icinde ve ${bus.destination} yonune duzenli sekilde ilerliyor`;
}

export function getBusDetailMetrics(bus: BusRecord): DetailMetric[] {
  const capacityInfo = getCapacityInfo(bus.occupancyRate);

  return [
    {
      icon: Activity,
      label: 'Occupancy',
      value: `${bus.occupancyRate}%`,
      sub: capacityInfo.label,
      accent: getStatusAccent(bus.status),
    },
    {
      icon: Users,
      label: 'Passengers',
      value: `${bus.activePassengerCount}`,
      sub: `of ${bus.maxCapacity} max`,
      accent: 'bg-cyan-500/20',
    },
    {
      icon: MapPin,
      label: 'Next Stop',
      value: bus.currentStop,
      sub: bus.destination,
      accent: 'bg-sky-500/20',
    },
    {
      icon: Clock3,
      label: 'Service State',
      value: bus.delayInMinutes ? `+${bus.delayInMinutes} min` : getStatusLabel(bus.status),
      sub: getStatusLabel(bus.status),
      accent: getStatusAccent(bus.status),
    },
  ];
}

export function getBusOperationalRows(bus: BusRecord): OperationalRow[] {
  const capacityInfo = getCapacityInfo(bus.occupancyRate);

  return [
    {
      label: 'Route Status',
      value: bus.delayInMinutes ? `${getStatusLabel(bus.status)} - +${bus.delayInMinutes} min` : getStatusLabel(bus.status),
      tag: getOperationalStatusTag(bus.status),
      tone: getOperationalStatusTone(bus.status),
    },
    {
      label: 'Load Distribution',
      value: `${bus.activePassengerCount} passenger on board, ${bus.maxCapacity - bus.activePassengerCount} seats available`,
      tag: capacityInfo.label,
      tone: `border-slate-600/60 bg-slate-700/30 ${capacityInfo.textClass}`,
    },
    {
      label: 'Tracking Feed',
      value: bus.status === 'OUT_OF_SERVICE' ? 'Vehicle feed limited to depot mode' : 'Database backed telemetry stream active',
      tag: bus.status === 'OUT_OF_SERVICE' ? 'Offline' : 'Connected',
      tone:
        bus.status === 'OUT_OF_SERVICE'
          ? 'border-slate-600/60 bg-slate-700/30 text-slate-300'
          : 'border-sky-500/25 bg-sky-500/10 text-sky-300',
    },
    {
      label: 'Operator Note',
      value:
        bus.status === 'ON_TIME'
          ? 'No service exception on this route.'
          : bus.status === 'DELAYED'
            ? 'Dispatch team should monitor headway consistency.'
            : 'Vehicle held outside active fleet rotation.',
      tag: bus.fleetCode,
      tone: 'border-slate-600/60 bg-slate-700/30 text-slate-200',
    },
  ];
}
