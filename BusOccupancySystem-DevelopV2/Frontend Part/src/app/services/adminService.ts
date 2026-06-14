import { normalizeBusRecord } from '../utils/busApiAdapter';
import type { BusRecord, BusStatus } from '../types/bus';
import type { ErrorLogRecord } from '../types/errorLog';
import { apiRequest } from './apiClient';

interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface BusAssignmentPayload {
  driverName?: string;
  plateNumber?: string;
}

export interface ErrorLogFilter {
  from?: string;
  to?: string;
}

export interface BusCreatePayload {
  lineCode: string;
  routeName: string;
  plateNumber: string;
  fleetCode?: string;
  currentStop?: string;
  destination?: string;
  maxCapacity?: number;
  driverName?: string;
  status?: BusStatus;
}

export interface AdminUserPayload {
  username: string;
  password: string;
}

// Admin: otobus sofor adi / plaka atamasini guncelle
export async function updateBusAssignment(busId: number, payload: BusAssignmentPayload): Promise<BusRecord> {
  const response = await apiRequest<Record<string, unknown>>(`/api/v1/buses/${busId}/assignment`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return normalizeBusRecord(response);
}

// Admin: hata loglarini sayfalayarak getir (en yeni once). from/to verilirse tarih araligina gore filtreler.
export async function getErrorLogs(page: number, size: number, filter?: ErrorLogFilter): Promise<SpringPage<ErrorLogRecord>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (filter?.from) params.set('from', filter.from);
  if (filter?.to) params.set('to', filter.to);
  return apiRequest<SpringPage<ErrorLogRecord>>(`/api/v1/admin/error-logs?${params.toString()}`);
}

// Admin: doluluk haric tum bilgileriyle yeni otobus olustur (occupancy backend'de otomatik 0 baslar)
export async function createBus(payload: BusCreatePayload): Promise<void> {
  await apiRequest<void>('/api/v1/buses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// Admin: yeni ADMIN yetkili kullanici olustur
export async function createAdminUser(payload: AdminUserPayload): Promise<void> {
  await apiRequest<void>('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
