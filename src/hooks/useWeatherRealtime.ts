import { useState, useEffect } from 'react';
import type { WeatherTelemetry } from '../core/types/weather.types';
import { mqttService } from '../core/di';

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

    mqttService.start();

    return () => {
      mqttService.stop();
    };
  }, []);

  return { data, connected };
}
