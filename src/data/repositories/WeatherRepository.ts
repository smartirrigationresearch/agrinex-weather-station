import type { WeatherTelemetry } from '../../core/types/weather.types';
import { FirebaseDataSource } from '../sources/FirebaseDataSource';

export interface IWeatherRepository {
  subscribe(callback: (data: WeatherTelemetry) => void): () => void;
  onConnectionChange(callback: (connected: boolean) => void): void;
  getHistory(limitCount?: number): Promise<WeatherTelemetry[]>;
  saveTelemetry(data: WeatherTelemetry): Promise<void>;
}

export class WeatherRepository implements IWeatherRepository {
  private firebaseSource: FirebaseDataSource;

  constructor(firebaseSource: FirebaseDataSource) {
    this.firebaseSource = firebaseSource;
  }

  subscribe(callback: (data: WeatherTelemetry) => void): () => void {
    return this.firebaseSource.subscribeTelemetry(callback);
  }

  onConnectionChange(callback: (connected: boolean) => void): void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    callback(navigator.onLine);
  }

  async saveTelemetry(data: WeatherTelemetry): Promise<void> {
    await this.firebaseSource.saveTelemetry(data);
  }

  async getHistory(limitCount: number = 50): Promise<WeatherTelemetry[]> {
    try {
      const fbData = await this.firebaseSource.getRecentTelemetry(limitCount);
      if (fbData && fbData.length > 0) {
        return fbData;
      }
    } catch (err) {
      console.warn('[WeatherRepository] Firebase history notice:', err);
    }

    try {
      const res = await fetch('/api/telemetry');
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.history) && json.history.length > 0) {
          return json.history;
        }
      }
    } catch (err) {
      console.warn('[WeatherRepository] API history fallback notice:', err);
    }

    return [];
  }
}
