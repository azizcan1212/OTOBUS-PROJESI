import { BUS_RESYNC_INTERVAL_MS } from '../config/env';
import { getBusList } from '../services/busService';
import type { BusRecord } from '../types/bus';
import { useBusRealtimeSubscription } from './useBusRealtimeSubscription';
import { useResourceQuery } from './useResourceQuery';

const EMPTY_BUS_LIST: BusRecord[] = [];

export function useBusList() {
  const resource = useResourceQuery<BusRecord[]>({
    initialData: EMPTY_BUS_LIST,
    queryKey: 'bus-list',
    intervalMs: BUS_RESYNC_INTERVAL_MS,
    fetcher: getBusList,
  });

  const isLiveConnected = useBusRealtimeSubscription((message) => {
    resource.setData((currentBuses) => {
      const nextBuses =
        message.type === 'fleet-snapshot'
          ? [...message.buses]
          : mergeBusList(currentBuses, message.buses, message.removedBusIds);

      return nextBuses.sort((leftBus, rightBus) => leftBus.id - rightBus.id);
    });
  });

  return {
    ...resource,
    isLiveConnected,
  };
}

function mergeBusList(currentBuses: BusRecord[], updatedBuses: BusRecord[], removedBusIds: number[]) {
  const busesById = new Map(currentBuses.map((bus) => [bus.id, bus]));

  updatedBuses.forEach((bus) => {
    busesById.set(bus.id, bus);
  });

  removedBusIds.forEach((busId) => {
    busesById.delete(busId);
  });

  return Array.from(busesById.values());
}
