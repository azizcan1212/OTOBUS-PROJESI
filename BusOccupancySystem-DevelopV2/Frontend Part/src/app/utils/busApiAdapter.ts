import type { BusRecord, BusStatus } from '../types/bus';

type Primitive = string | number | null | undefined;

interface RawBusRecord extends Record<string, unknown> {
  id?: Primitive;
  fleetCode?: Primitive;
  fleet_code?: Primitive;
  lineCode?: Primitive;
  line_code?: Primitive;
  routeName?: Primitive;
  route_name?: Primitive;
  destination?: Primitive;
  currentStop?: Primitive;
  current_stop?: Primitive;
  plateNumber?: Primitive;
  plate_number?: Primitive;
  driverName?: Primitive;
  driver_name?: Primitive;
  occupancyRate?: Primitive;
  occupancy_rate?: Primitive;
  maxCapacity?: Primitive;
  max_capacity?: Primitive;
  activePassengerCount?: Primitive;
  active_passenger_count?: Primitive;
  status?: Primitive;
  delayInMinutes?: Primitive;
  delay_in_minutes?: Primitive;
  lastUpdatedAt?: Primitive;
  last_updated_at?: Primitive;
}

const STATUS_ALIASES: Record<string, BusStatus> = {
  ON_TIME: 'ON_TIME',
  ONTIME: 'ON_TIME',
  'ON TIME': 'ON_TIME',
  DELAYED: 'DELAYED',
  OUT_OF_SERVICE: 'OUT_OF_SERVICE',
  OUTOFSERVICE: 'OUT_OF_SERVICE',
  'OUT OF SERVICE': 'OUT_OF_SERVICE',
};

function getString(value: Primitive, fallback = '') {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return fallback;
}

function getNumber(value: Primitive, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function normalizeStatus(value: Primitive): BusStatus {
  const normalized = getString(value, 'OUT_OF_SERVICE').trim().toUpperCase().replace(/[-\s]+/g, '_');
  return STATUS_ALIASES[normalized] ?? 'OUT_OF_SERVICE';
}

function getPassengerCount(raw: RawBusRecord, occupancyRate: number, maxCapacity: number) {
  const explicitPassengerCount = getNumber(raw.activePassengerCount ?? raw.active_passenger_count, -1);
  if (explicitPassengerCount >= 0) {
    return explicitPassengerCount;
  }

  return Math.round((occupancyRate / 100) * maxCapacity);
}

export function normalizeBusRecord(raw: RawBusRecord): BusRecord {
  const maxCapacity = getNumber(raw.maxCapacity ?? raw.max_capacity, 60);
  const rawOccupancyRate = getNumber(raw.occupancyRate ?? raw.occupancy_rate, -1);
  const activePassengerCount = getPassengerCount(raw, rawOccupancyRate, maxCapacity);
  const occupancyRate =
    rawOccupancyRate >= 0
      ? rawOccupancyRate
      : maxCapacity > 0
        ? Math.round((activePassengerCount / maxCapacity) * 100)
        : 0;

  return {
    id: getNumber(raw.id),
    fleetCode: getString(raw.fleetCode ?? raw.fleet_code, `BUS-${getNumber(raw.id)}`),
    lineCode: getString(raw.lineCode ?? raw.line_code, 'Unknown Line'),
    routeName: getString(raw.routeName ?? raw.route_name, getString(raw.destination, 'Unknown Route')),
    destination: getString(raw.destination, 'Unknown Destination'),
    currentStop: getString(raw.currentStop ?? raw.current_stop, 'Unknown Stop'),
    plateNumber: getString(raw.plateNumber ?? raw.plate_number, '') || null,
    driverName: getString(raw.driverName ?? raw.driver_name, '') || null,
    occupancyRate,
    maxCapacity,
    activePassengerCount,
    status: normalizeStatus(raw.status),
    delayInMinutes: raw.delayInMinutes == null && raw.delay_in_minutes == null
      ? null
      : getNumber(raw.delayInMinutes ?? raw.delay_in_minutes),
    lastUpdatedAt: getString(raw.lastUpdatedAt ?? raw.last_updated_at, new Date().toISOString()),
  };
}
