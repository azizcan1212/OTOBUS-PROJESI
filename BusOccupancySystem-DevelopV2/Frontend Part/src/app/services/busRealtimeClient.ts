import { BUS_REALTIME_URL } from '../config/env';
import type { BusRealtimeMessage } from '../types/bus';
import { normalizeBusRecord } from '../utils/busApiAdapter';

type MessageListener = (message: BusRealtimeMessage) => void;
type ConnectionListener = (isConnected: boolean) => void;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeRemovedBusIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item))
    .map((item) => Math.trunc(item));
}

function parseRealtimeMessage(data: string): BusRealtimeMessage | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(data);
  } catch {
    return null;
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.buses)) {
    return null;
  }

  const type = parsed.type === 'fleet-snapshot' ? 'fleet-snapshot' : 'bus-updated';

  return {
    type,
    generatedAt: typeof parsed.generatedAt === 'string' ? parsed.generatedAt : new Date().toISOString(),
    buses: parsed.buses
      .filter(isRecord)
      .map((bus) => normalizeBusRecord(bus)),
    removedBusIds: normalizeRemovedBusIds(parsed.removedBusIds),
  };
}

class BusRealtimeClient {
  private socket: WebSocket | null = null;
  private reconnectTimeoutId: number | null = null;
  private reconnectAttempt = 0;
  private isConnected = false;
  private readonly messageListeners = new Set<MessageListener>();
  private readonly connectionListeners = new Set<ConnectionListener>();

  subscribe(listener: MessageListener) {
    this.messageListeners.add(listener);
    this.ensureConnection();

    return () => {
      this.messageListeners.delete(listener);
      this.cleanupIfIdle();
    };
  }

  subscribeConnection(listener: ConnectionListener) {
    this.connectionListeners.add(listener);
    listener(this.isConnected);
    this.ensureConnection();

    return () => {
      this.connectionListeners.delete(listener);
      this.cleanupIfIdle();
    };
  }

  private ensureConnection() {
    if (!this.hasSubscribers()) {
      return;
    }

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (this.reconnectTimeoutId !== null) {
      window.clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    const socket = new WebSocket(BUS_REALTIME_URL);
    this.socket = socket;

    socket.onopen = () => {
      this.reconnectAttempt = 0;
      this.updateConnectionState(true);
    };

    socket.onmessage = (event) => {
      if (typeof event.data !== 'string') {
        return;
      }

      const message = parseRealtimeMessage(event.data);
      if (!message) {
        return;
      }

      this.messageListeners.forEach((listener) => listener(message));
    };

    socket.onerror = () => {
      socket.close();
    };

    socket.onclose = () => {
      if (this.socket === socket) {
        this.socket = null;
      }

      this.updateConnectionState(false);
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    if (!this.hasSubscribers() || this.reconnectTimeoutId !== null) {
      return;
    }

    const delay = Math.min(1000 * 2 ** this.reconnectAttempt, 10_000);
    this.reconnectAttempt += 1;
    this.reconnectTimeoutId = window.setTimeout(() => {
      this.reconnectTimeoutId = null;
      this.ensureConnection();
    }, delay);
  }

  private cleanupIfIdle() {
    if (this.hasSubscribers()) {
      return;
    }

    if (this.reconnectTimeoutId !== null) {
      window.clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.updateConnectionState(false);
  }

  private updateConnectionState(nextState: boolean) {
    if (this.isConnected === nextState) {
      return;
    }

    this.isConnected = nextState;
    this.connectionListeners.forEach((listener) => listener(nextState));
  }

  private hasSubscribers() {
    return this.messageListeners.size > 0 || this.connectionListeners.size > 0;
  }
}

const busRealtimeClient = new BusRealtimeClient();

export function subscribeToBusRealtime(listener: MessageListener) {
  return busRealtimeClient.subscribe(listener);
}

export function subscribeToBusRealtimeStatus(listener: ConnectionListener) {
  return busRealtimeClient.subscribeConnection(listener);
}
