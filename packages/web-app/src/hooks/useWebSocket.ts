import { useEffect, useRef, useState } from 'react';
import { websocketService } from '../services/websocket';

export const useWebSocket = (url?: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRefs = useRef<Map<string, () => void>>(new Map());

  useEffect(() => {
    websocketService.connect(url);

    const unsubscribeConnected = websocketService.subscribe(
      'connected',
      (connected: boolean) => {
        setIsConnected(connected);
      }
    );

    const unsubscribeError = websocketService.subscribe(
      'error',
      (error: Error) => {
        setError(error);
      }
    );

    return () => {
      unsubscribeConnected();
      unsubscribeError();
      // Clean up all subscriptions
      unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
      unsubscribeRefs.current.clear();
    };
  }, [url]);

  const subscribe = (event: string, callback: Function) => {
    const unsubscribe = websocketService.subscribe(event, callback);
    unsubscribeRefs.current.set(event, unsubscribe);
    return unsubscribe;
  };

  const unsubscribe = (event: string) => {
    const unsubscribe = unsubscribeRefs.current.get(event);
    if (unsubscribe) {
      unsubscribe();
      unsubscribeRefs.current.delete(event);
    }
  };

  const send = (event: string, data: any) => {
    websocketService.send(event, data);
  };

  return {
    isConnected,
    error,
    subscribe,
    unsubscribe,
    send,
  };
};
