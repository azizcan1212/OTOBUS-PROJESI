import { BUS_RESYNC_INTERVAL_MS } from '../config/env';
import { getBusById } from '../services/busService';
import type { BusRecord } from '../types/bus';
import { useBusRealtimeSubscription } from './useBusRealtimeSubscription';
import { useResourceQuery } from './useResourceQuery';

export function useBusDetail(busId: number | null) {
  const resource = useResourceQuery<BusRecord | null>({
    initialData: null,
    queryKey: `bus-detail-${busId ?? 'unknown'}`,
    intervalMs: BUS_RESYNC_INTERVAL_MS,
    enabled: busId !== null,
    fetcher: async () => {
      if (busId === null) {
        return null;
      }

      return getBusById(busId);
    },
  });

  const isLiveConnected = useBusRealtimeSubscription(
    (message) => {
      if (busId === null) {
        return;
      }

      if (message.removedBusIds.includes(busId)) {
        resource.setData(null);
        return;
      }

      const updatedBus = message.buses.find((bus) => bus.id === busId);
      if (!updatedBus) {
        return;
      }

      resource.setData((currentBus) => mergeBusDetail(currentBus, updatedBus));
    },
    busId !== null,
  );

  return {
    ...resource,
    isLiveConnected,
  };
}

function mergeBusDetail(currentBus: BusRecord | null, updatedBus: BusRecord) {
  if (!currentBus) {
    return updatedBus;
  }

  return {
    ...currentBus,
    ...updatedBus,
    plateNumber: currentBus.plateNumber ?? updatedBus.plateNumber,
    driverName: currentBus.driverName ?? updatedBus.driverName,
  };
}
