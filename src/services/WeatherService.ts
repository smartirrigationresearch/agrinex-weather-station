import type { WeatherTelemetry } from '../core/types/weather.types';
import type { BmkgForecastData } from '../core/types/bmkg.types';
import type { IBmkgRepository } from '../data/repositories/BmkgRepository';

export interface ComparisonMetrics {
  tempDelta: string;
  humDelta: string;
  windDelta: string;
  tempErrorPct: string;
}

export class WeatherService {
  private bmkgRepo: IBmkgRepository;

  constructor(bmkgRepo: IBmkgRepository) {
    this.bmkgRepo = bmkgRepo;
  }

  async getBmkgObservation(): Promise<BmkgForecastData> {
    return this.bmkgRepo.getLatestObservation();
  }

  async getTomorrowForecast(): Promise<import('../core/types/bmkg.types').TomorrowForecast> {
    return this.bmkgRepo.getTomorrowForecast();
  }

  calculateComparison(fieldData: WeatherTelemetry, bmkgData: BmkgForecastData): ComparisonMetrics {
    const tDelta = fieldData.temperature - bmkgData.temperature;
    const hDelta = fieldData.humidity - bmkgData.humidity;
    const wDelta = fieldData.wind_speed - bmkgData.wind_speed;

    const tErrorPct = bmkgData.temperature > 0 
      ? (Math.abs(tDelta) / bmkgData.temperature) * 100 
      : 0;

    return {
      tempDelta: (tDelta > 0 ? '+' : '') + tDelta.toFixed(1) + ' °C',
      humDelta: (hDelta > 0 ? '+' : '') + hDelta.toFixed(1) + ' %',
      windDelta: (wDelta > 0 ? '+' : '') + wDelta.toFixed(1) + ' km/h',
      tempErrorPct: tErrorPct.toFixed(2) + ' %',
    };
  }
}
