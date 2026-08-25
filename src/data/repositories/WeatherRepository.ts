import type { WeatherTelemetry } from '../../core/types/weather.types';
import { MqttDataSource } from '../sources/MqttDataSource';

export interface IWeatherRepository {
  subscribe(callback: (data: WeatherTelemetry) => void): void;
  onConnectionChange(callback: (connected: boolean) => void): void;
  connect(): void;
  disconnect(): void;
}

export class WeatherRepository implements IWeatherRepository {
  private mqttSource: MqttDataSource;

  constructor(mqttSource: MqttDataSource) {
    this.mqttSource = mqttSource;
  }

  subscribe(callback: (data: WeatherTelemetry) => void): void {
    this.mqttSource.onMessage((_topic, payload) => {
      try {
        const data = JSON.parse(payload) as WeatherTelemetry;
        callback(data);
      } catch (err) {
        console.error('Failed to parse telemetry data', err);
      }
    });
  }

  onConnectionChange(callback: (connected: boolean) => void): void {
    this.mqttSource.onConnectionStateChange(callback);
  }

  connect(): void {
    this.mqttSource.connect();
  }

  disconnect(): void {
    this.mqttSource.disconnect();
  }
}
