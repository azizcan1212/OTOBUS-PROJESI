import { normalizeBusRecord } from '../utils/busApiAdapter';
import type { BusRecord } from '../types/bus';
import { ApiError, apiRequest } from './apiClient';

// Spring Page<T> yanit yapisi
interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/**
 * Tum otobüsleri getirir.
 * Backend artik Page<BusSummaryDto> donduruyor — content alanini cekelim.
 * Buyuk filolar icin: ?page=0&size=100 gibi parametreler eklenebilir.
 */
export async function getBusList(): Promise<BusRecord[]> {
  const response = await apiRequest<SpringPage<Record<string, unknown>>>('/api/v1/buses?size=200');
  return response.content.map((item) => normalizeBusRecord(item));
}

export async function getBusById(id: number): Promise<BusRecord | null> {
  try {
    const response = await apiRequest<Record<string, unknown>>(`/api/v1/buses/${encodeURIComponent(String(id))}`);
    return normalizeBusRecord(response);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}
