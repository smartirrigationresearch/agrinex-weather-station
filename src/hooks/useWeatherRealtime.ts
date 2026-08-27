import { useState, useEffect } from 'react';
import type { WeatherTelemetry } from '../core/types/weather.types';
import { weatherRepository } from '../core/di';

export function useWeatherRealtime() {
  const [data, setData] = useState<WeatherTelemetry | null>(null);
  const [connected, setConnected] = useState<boolean>(true);

  useEffect(() => {
    // Initial load from Firebase history
    weatherRepository.getHistory(50).then((history) => {
      if (history && history.length > 0) {
        setData(history[0]);
      }
    }).catch(err => console.warn('[Weather] History fetch notice:', err));

    // Firebase Firestore Realtime Stream (onSnapshot)
    const unsubscribeStream = weatherRepository.subscribe((latestData) => {
      if (latestData) {
        setData(latestData);
        setConnected(true);
      }
    });

    // Connection state handler
    weatherRepository.onConnectionChange((isOnline) => {
      setConnected(isOnline);
    });

    return () => {
      unsubscribeStream();
    };
  }, []);

  return { data, connected };
}
