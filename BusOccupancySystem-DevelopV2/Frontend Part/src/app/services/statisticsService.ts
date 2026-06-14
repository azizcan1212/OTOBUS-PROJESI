import type { BusStatisticsRecord, StatisticsFilters } from '../types/statistics';
import { apiRequest } from './apiClient';

function buildStatisticsQuery(filters: StatisticsFilters) {
  const searchParams = new URLSearchParams();
  searchParams.set('period', filters.period);

  if (filters.hourFrom && filters.hourTo) {
    searchParams.set('hourFrom', filters.hourFrom);
    searchParams.set('hourTo', filters.hourTo);
  }

  if (filters.plateNumber.trim()) {
    searchParams.set('plateNumber', filters.plateNumber.trim());
  }

  if (filters.fleetCode.trim()) {
    searchParams.set('fleetCode', filters.fleetCode.trim());
  }

  return searchParams.toString();
}

export async function getStatistics(filters: StatisticsFilters): Promise<BusStatisticsRecord> {
  const query = buildStatisticsQuery(filters);
  return apiRequest<BusStatisticsRecord>(`/api/v1/statistics${query ? `?${query}` : ''}`);
}
