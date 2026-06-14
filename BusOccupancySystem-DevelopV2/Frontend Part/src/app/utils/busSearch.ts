import type { BusRecord } from '../types/bus';

function normalize(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

export function filterBuses(buses: BusRecord[], query: string) {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return buses;
  }

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

  return buses.filter((bus) => {
    const haystack = normalize(
      [
        bus.id,
        bus.fleetCode,
        bus.lineCode,
        bus.routeName,
        bus.destination,
        bus.currentStop,
        bus.plateNumber ?? '',
        bus.driverName ?? '',
        bus.status,
        bus.delayInMinutes ?? '',
      ]
        .join(' ')
        .replace(/[^a-z0-9+\s-]/gi, ' '),
    );

    return tokens.every((token) => haystack.includes(token));
  });
}
