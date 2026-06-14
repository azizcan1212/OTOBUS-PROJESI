import type { BusStatus } from '../types/bus';

const STATUS_METADATA: Record<
  BusStatus,
  {
    badgeText: string;
    dotClass: string;
    textClass: string;
    accentClass: string;
    operationalTag: string;
    operationalTone: string;
  }
> = {
  ON_TIME: {
    badgeText: 'On Time',
    dotClass: 'bg-emerald-400',
    textClass: 'text-emerald-400',
    accentClass: 'bg-emerald-500/20',
    operationalTag: 'Stable',
    operationalTone: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
  },
  DELAYED: {
    badgeText: 'Delayed',
    dotClass: 'bg-amber-400',
    textClass: 'text-amber-400',
    accentClass: 'bg-amber-500/20',
    operationalTag: 'Attention',
    operationalTone: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
  },
  OUT_OF_SERVICE: {
    badgeText: 'Out of Service',
    dotClass: 'bg-slate-500',
    textClass: 'text-slate-400',
    accentClass: 'bg-slate-600/25',
    operationalTag: 'Offline',
    operationalTone: 'border-slate-600/60 bg-slate-700/30 text-slate-300',
  },
};

const FALLBACK_STATUS_METADATA = {
  badgeText: 'Unknown',
  dotClass: 'bg-slate-400',
  textClass: 'text-slate-300',
  accentClass: 'bg-slate-600/25',
  operationalTag: 'Unknown',
  operationalTone: 'border-slate-600/60 bg-slate-700/30 text-slate-300',
};

function getStatusMetadata(status: string) {
  return STATUS_METADATA[status as BusStatus] ?? FALLBACK_STATUS_METADATA;
}

export function getBadgeStyle(badge: string) {
  const map: Record<string, string> = {
    empty: 'bg-slate-700 text-slate-300 border-slate-600',
    low: 'bg-emerald-900/60 text-emerald-400 border-emerald-700',
    moderate: 'bg-amber-900/60 text-amber-400 border-amber-700',
    high: 'bg-red-900/60 text-red-400 border-red-700',
    critical: 'bg-red-600/30 text-red-300 border-red-500',
  };

  return map[badge] ?? map.empty;
}

export function getStatusLabel(status: BusStatus) {
  return getStatusMetadata(status).badgeText;
}

export function getStatusStyle(status: BusStatus) {
  return getStatusMetadata(status).textClass;
}

export function getStatusDot(status: BusStatus) {
  return getStatusMetadata(status).dotClass;
}

export function getStatusAccent(status: BusStatus) {
  return getStatusMetadata(status).accentClass;
}

export function getOperationalStatusTag(status: BusStatus) {
  return getStatusMetadata(status).operationalTag;
}

export function getOperationalStatusTone(status: BusStatus) {
  return getStatusMetadata(status).operationalTone;
}
