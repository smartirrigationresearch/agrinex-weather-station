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

    // Direct REST polling fallback (/api/telemetry) setara HTTPS native
    const pollApi = async () => {
      try {
        const res = await fetch('/api/telemetry');
        if (res.ok) {
          const telemetry: WeatherTelemetry = await res.json();
          if (telemetry && (telemetry.temperature !== undefined || (telemetry as any).temp !== undefined)) {
            const newTelemetry: WeatherTelemetry = {
              timestamp: telemetry.timestamp || new Date().toISOString(),
              temperature: Number(telemetry.temperature ?? (telemetry as any).temp ?? 0),
              humidity: Number(telemetry.humidity ?? (telemetry as any).hum ?? 0),
              wind_speed: Number(telemetry.wind_speed ?? (telemetry as any).windSpeed ?? 0),
              light_lux: Number(telemetry.light_lux ?? (telemetry as any).lightLux ?? 0),
            };

            // Simpan secara permanen ke Firebase Cloud Database Firestore
            weatherRepository.saveTelemetry(newTelemetry);

            setData(prev => {
              if (!prev || prev.timestamp !== newTelemetry.timestamp) {
                return newTelemetry;
              }
              return prev;
            });
            setConnected(true);
          }
        }
      } catch (err) {
        // Silent catch for API polling fallback
      }
    };

    pollApi();
    const interval = setInterval(pollApi, 5000);

    mqttService.start();

    return () => {
      clearInterval(interval);
      mqttService.stop();
    };
  }, []);

  return { data, connected };
}
