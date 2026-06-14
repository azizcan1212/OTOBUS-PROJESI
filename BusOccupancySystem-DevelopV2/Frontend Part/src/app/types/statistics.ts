import type { BusStatus } from './bus';

export type StatisticsPeriod =
  | 'DAY'
  | 'WEEK'
  | 'MONTH'
  | 'THREE_MONTHS'
  | 'SIX_MONTHS'
  | 'TWELVE_MONTHS';

export interface StatisticsFilters {
  period: StatisticsPeriod;
  hourFrom: string;
  hourTo: string;
  plateNumber: string;
  fleetCode: string;
}

export interface HourlyOccupancyPoint {
  hour: number;
  sampleCount: number;
  averageOccupancyRate: number;
  averagePassengerCount: number;
}

export interface DailyStatisticsPoint {
  date: string;
  label: string;
  sampleCount: number;
  averageOccupancyRate: number;
  averagePassengerCount: number;
  peakOccupancyRate: number;
  peakPassengerCount: number;
}

export interface StatusDistributionPoint {
  status: BusStatus;
  label: string;
  count: number;
  percentage: number;
}

export interface BusStatisticsRecord {
  period: StatisticsPeriod;
  zoneId: string;
  startAt: string;
  endAt: string;
  generatedAt: string;
  hourFrom: number | null;
  hourTo: number | null;
  plateNumber: string | null;
  fleetCode: string | null;
  sampleCount: number;
  liveBusCount: number;
  liveDataIncluded: boolean;
  averageOccupancyRate: number;
  averagePassengerCount: number;
  hourlyBreakdown: HourlyOccupancyPoint[];
  dailyBreakdown: DailyStatisticsPoint[];
  statusDistribution: StatusDistributionPoint[];
}
