export interface CapacityInfo {
  fill: string;
  fillLight: string;
  label: string;
  badge: string;
  textClass: string;
}

export function getCapacityInfo(capacity: number): CapacityInfo {
  if (capacity === 0) {
    return {
      fill: '#64748b',
      fillLight: '#94a3b8',
      label: 'Empty',
      badge: 'empty',
      textClass: 'text-slate-300',
    };
  }

  if (capacity <= 40) {
    return {
      fill: '#22c55e',
      fillLight: '#86efac',
      label: 'Low',
      badge: 'low',
      textClass: 'text-emerald-300',
    };
  }

  if (capacity <= 70) {
    return {
      fill: '#f59e0b',
      fillLight: '#fcd34d',
      label: 'Moderate',
      badge: 'moderate',
      textClass: 'text-amber-300',
    };
  }

  if (capacity <= 100) {
    return {
      fill: '#ef4444',
      fillLight: '#fca5a5',
      label: 'High',
      badge: 'high',
      textClass: 'text-red-300',
    };
  }

  // Kapasitenin %100'unu asan doluluk - kritik asiri yuk durumu
  return {
    fill: '#dc2626',
    fillLight: '#fca5a5',
    label: 'Overcapacity',
    badge: 'critical',
    textClass: 'text-red-400',
  };
}

// Otobus, kapasitenin %100'unu asan bir doluluga sahipse true doner
export function isOvercapacity(capacity: number): boolean {
  return capacity > 100;
}
