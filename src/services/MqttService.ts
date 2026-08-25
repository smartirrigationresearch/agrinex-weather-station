import type { IWeatherRepository } from '../data/repositories/WeatherRepository';
import type { WeatherTelemetry } from '../core/types/weather.types';

export class MqttService {
  private weatherRepo: IWeatherRepository;

  constructor(weatherRepo: IWeatherRepository) {
    this.weatherRepo = weatherRepo;
  }

  start(): void {
    this.weatherRepo.connect();
  }

  stop(): void {
    this.weatherRepo.disconnect();
  }

  onTelemetry(callback: (data: WeatherTelemetry) => void): void {
    this.weatherRepo.subscribe(callback);
  }

  onConnectionStatus(callback: (connected: boolean) => void): void {
    this.weatherRepo.onConnectionChange(callback);
  }
}
