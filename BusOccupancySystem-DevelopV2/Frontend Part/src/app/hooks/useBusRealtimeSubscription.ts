import { useEffect, useRef, useState } from 'react';

import type { BusRealtimeMessage } from '../types/bus';
import { subscribeToBusRealtime, subscribeToBusRealtimeStatus } from '../services/busRealtimeClient';

export function useBusRealtimeSubscription(
  onMessage: (message: BusRealtimeMessage) => void,
  enabled = true,
) {
  const [isConnected, setIsConnected] = useState(false);
  const handlerRef = useRef(onMessage);

  useEffect(() => {
    handlerRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled) {
      setIsConnected(false);
      return;
    }

    const unsubscribeMessages = subscribeToBusRealtime((message) => {
      handlerRef.current(message);
    });
    const unsubscribeStatus = subscribeToBusRealtimeStatus(setIsConnected);

    return () => {
      unsubscribeMessages();
      unsubscribeStatus();
    };
  }, [enabled]);

  return isConnected;
}
