import { useState, useEffect } from 'react';
import type { BmkgForecastData } from '../core/types/bmkg.types';
import type { WeatherTelemetry } from '../core/types/weather.types';
import { weatherService } from '../core/di';

export function useBmkgComparison(fieldData: WeatherTelemetry | null) {
  const [bmkgData, setBmkgData] = useState<BmkgForecastData | null>(null);
  const [tomorrowForecast, setTomorrowForecast] = useState<import('../core/types/bmkg.types').TomorrowForecast | null>(null);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const fetchBmkg = async () => {
      try {
        const obs = await weatherService.getBmkgObservation();
        const forecast = await weatherService.getTomorrowForecast();
        setBmkgData(obs);
        setTomorrowForecast(forecast);
      } catch (e) {
        console.error('Failed to fetch BMKG', e);
      }
    };

    fetchBmkg();
    const interval = setInterval(fetchBmkg, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (fieldData && bmkgData) {
      setMetrics(weatherService.calculateComparison(fieldData, bmkgData));
    }
  }, [fieldData, bmkgData]);

  return { bmkgData, tomorrowForecast, metrics };
}
