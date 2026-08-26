import { useState, useEffect } from 'react';
import type { WeatherTelemetry } from '../core/types/weather.types';
import { weatherRepository } from '../core/di';

export function useWeatherRealtime() {
  const [data, setData] = useState<WeatherTelemetry | null>(null);
  const [connected, setConnected] = useState<boolean>(true);

  useEffect(() => {
    // Initial load from history
    weatherRepository.getHistory(50).then((history) => {
      if (history && history.length > 0) {
        setData(history[0]);
      }
    }).catch(err => console.warn('[Weather] History fetch notice:', err));

    // Direct HTTPS REST polling (/api/telemetry)
    const pollApi = async () => {
      try {
        const res = await fetch('/api/telemetry');
        if (res.ok) {
          const json = await res.json();
          const telemetry = json.latest || json;
          if (telemetry && (telemetry.temperature !== undefined || (telemetry as any).temp !== undefined)) {
            const currentData: WeatherTelemetry = {
              timestamp: telemetry.timestamp || new Date().toISOString(),
              temperature: Number(telemetry.temperature ?? (telemetry as any).temp ?? 0),
              humidity: Number(telemetry.humidity ?? (telemetry as any).hum ?? 0),
              wind_speed: Number(telemetry.wind_speed ?? (telemetry as any).windSpeed ?? 0),
              light_lux: Number(telemetry.light_lux ?? (telemetry as any).lightLux ?? 0),
            };

            setData(prev => {
              if (!prev || prev.timestamp !== currentData.timestamp) {
                return currentData;
              }
              return prev;
            });
            setConnected(true);
          }
        }
      } catch (err) {
        // Silent catch for API polling
      }
    };

    pollApi();
    const interval = setInterval(pollApi, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return { data, connected };
}
