import { useState, useEffect } from 'react';
import type { WeatherTelemetry } from '../core/types/weather.types';
import { mqttService, weatherRepository } from '../core/di';

export function useWeatherRealtime() {
  const [data, setData] = useState<WeatherTelemetry | null>(null);
  const [connected, setConnected] = useState<boolean>(false);

  useEffect(() => {
    mqttService.onConnectionStatus((status) => {
      setConnected(status);
    });

    mqttService.onTelemetry((telemetry) => {
      setData(telemetry);
    });

    // Initial load from Firebase history so web app shows real data immediately
    weatherRepository.getHistory(50).then((history) => {
      if (history && history.length > 0) {
        setData(prev => prev || history[0]);
      }
    }).catch(err => console.warn('[Weather] History fetch notice:', err));

    mqttService.start();

    return () => {
      mqttService.stop();
    };
  }, []);

  return { data, connected };
}
