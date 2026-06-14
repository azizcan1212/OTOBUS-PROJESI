import { BUS_RESYNC_INTERVAL_MS } from '../config/env';
import { useEffect, useRef } from 'react';

import { getStatistics } from '../services/statisticsService';
import type { BusStatisticsRecord, StatisticsFilters } from '../types/statistics';
import { useBusRealtimeSubscription } from './useBusRealtimeSubscription';
import { useResourceQuery } from './useResourceQuery';

const EMPTY_STATISTICS: BusStatisticsRecord = {
  period: 'DAY',
  zoneId: 'Europe/Istanbul',
  startAt: new Date(0).toISOString(),
  endAt: new Date(0).toISOString(),
  generatedAt: new Date(0).toISOString(),
  hourFrom: null,
  hourTo: null,
  plateNumber: null,
  fleetCode: null,
  sampleCount: 0,
  liveBusCount: 0,
  liveDataIncluded: false,
  averageOccupancyRate: 0,
  averagePassengerCount: 0,
  hourlyBreakdown: [],
  dailyBreakdown: [],
  statusDistribution: [],
};

export function useStatistics(filters: StatisticsFilters, enabled: boolean) {
  const resource = useResourceQuery<BusStatisticsRecord>({
    initialData: EMPTY_STATISTICS,
    queryKey: `statistics-${JSON.stringify(filters)}`,
    intervalMs: BUS_RESYNC_INTERVAL_MS,
    enabled,
    fetcher: () => getStatistics(filters),
  });
  const refetchTimeoutRef = useRef<number | null>(null);

  const isLiveConnected = useBusRealtimeSubscription(
    () => {
      if (refetchTimeoutRef.current !== null) {
        window.clearTimeout(refetchTimeoutRef.current);
      }

      refetchTimeoutRef.current = window.setTimeout(() => {
        void resource.refetch();
      }, 400);
    },
    enabled,
  );

  useEffect(() => {
    return () => {
      if (refetchTimeoutRef.current !== null) {
        window.clearTimeout(refetchTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...resource,
    isLiveConnected,
  };
}
