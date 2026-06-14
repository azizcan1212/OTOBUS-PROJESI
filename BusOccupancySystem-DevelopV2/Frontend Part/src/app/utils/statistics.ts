import type { DailyStatisticsPoint, HourlyOccupancyPoint, StatisticsFilters, StatisticsPeriod } from '../types/statistics';

export const PERIOD_OPTIONS: Array<{ value: StatisticsPeriod; label: string }> = [
  { value: 'DAY', label: 'Gun' },
  { value: 'WEEK', label: 'Hafta' },
  { value: 'MONTH', label: 'Ay' },
  { value: 'THREE_MONTHS', label: '3 Ay' },
  { value: 'SIX_MONTHS', label: '6 Ay' },
  { value: 'TWELVE_MONTHS', label: '12 Ay' },
];

export const DEFAULT_STATISTICS_FILTERS: StatisticsFilters = {
  period: 'MONTH',
  hourFrom: '',
  hourTo: '',
  plateNumber: '',
  fleetCode: '',
};

export function getPeakDailyPoint(points: DailyStatisticsPoint[], selector: (point: DailyStatisticsPoint) => number) {
  return points.reduce<DailyStatisticsPoint | null>((bestPoint, point) => {
    if (!bestPoint || selector(point) > selector(bestPoint)) {
      return point;
    }

    return bestPoint;
  }, null);
}

export function getPeakHourPoint(points: HourlyOccupancyPoint[]) {
  return points.reduce<HourlyOccupancyPoint | null>((bestPoint, point) => {
    if (!bestPoint || point.averagePassengerCount > bestPoint.averagePassengerCount) {
      return point;
    }

    return bestPoint;
  }, null);
}
