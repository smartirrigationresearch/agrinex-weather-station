import type { WeatherTelemetry } from '../../core/types/weather.types';
import { MqttDataSource } from '../sources/MqttDataSource';
import { FirebaseDataSource } from '../sources/FirebaseDataSource';

export interface IWeatherRepository {
  subscribe(callback: (data: WeatherTelemetry) => void): void;
  onConnectionChange(callback: (connected: boolean) => void): void;
  connect(): void;
  disconnect(): void;
  getHistory(limitCount?: number): Promise<WeatherTelemetry[]>;
}

export class WeatherRepository implements IWeatherRepository {
  private mqttSource: MqttDataSource;
  private firebaseSource: FirebaseDataSource;

  constructor(mqttSource: MqttDataSource, firebaseSource: FirebaseDataSource) {
    this.mqttSource = mqttSource;
    this.firebaseSource = firebaseSource;
  }

  subscribe(callback: (data: WeatherTelemetry) => void): void {
    // 1. MQTT Stream (WS/WSS)
    this.mqttSource.onMessage((_topic, payload) => {
      try {
        const data = JSON.parse(payload) as WeatherTelemetry;
        callback(data);
        // Simpan otomatis ke Firebase Firestore (Hanya 96x write / hari)
        this.firebaseSource.saveTelemetry(data);
      } catch (err) {
        console.error('Failed to parse telemetry data', err);
      }
    });

    // 2. Firebase Firestore Realtime Stream (HTTPS compliant)
    // Memastikan data ter-update secara otomatis di web HTTPS tanpa hambatan Mixed Content
    this.firebaseSource.subscribeTelemetry((data) => {
      callback(data);
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

  async getHistory(limitCount: number = 50): Promise<WeatherTelemetry[]> {
    return this.firebaseSource.getRecentTelemetry(limitCount);
  }
}
