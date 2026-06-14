const DEFAULT_API_BASE_URL = 'http://localhost:8080';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/+$/, '');

function resolveRealtimeUrl() {
  if (import.meta.env.VITE_BUS_WS_URL) {
    return String(import.meta.env.VITE_BUS_WS_URL).replace(/\/+$/, '');
  }

  const realtimeProtocolUrl = API_BASE_URL.replace(/^http/i, 'ws');
  return `${realtimeProtocolUrl}/ws/buses`;
}

export const BUS_REALTIME_URL = resolveRealtimeUrl();
export const BUS_RESYNC_INTERVAL_MS = 180_000;
