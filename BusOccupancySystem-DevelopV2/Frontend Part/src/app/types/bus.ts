export type BusStatus = 'ON_TIME' | 'DELAYED' | 'OUT_OF_SERVICE';

export interface BusRecord {
  id: number;
  fleetCode: string;
  lineCode: string;
  routeName: string;
  destination: string;
  currentStop: string;
  plateNumber: string | null;
  driverName: string | null;
  occupancyRate: number;
  maxCapacity: number;
  activePassengerCount: number;
  status: BusStatus;
  delayInMinutes: number | null;
  lastUpdatedAt: string;
}

export interface BusRealtimeMessage {
  type: 'fleet-snapshot' | 'bus-updated';
  generatedAt: string;
  buses: BusRecord[];
  removedBusIds: number[];
}
