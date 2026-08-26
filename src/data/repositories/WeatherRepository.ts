import type { WeatherTelemetry } from '../../core/types/weather.types';
import { MqttDataSource } from '../sources/MqttDataSource';
import { FirebaseDataSource } from '../sources/FirebaseDataSource';

export interface IWeatherRepository {
  subscribe(callback: (data: WeatherTelemetry) => void): void;
  onConnectionChange(callback: (connected: boolean) => void): void;
  connect(): void;
  disconnect(): void;
  getHistory(limitCount?: number): Promise<WeatherTelemetry[]>;
  saveTelemetry(data: WeatherTelemetry): Promise<void>;
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
      console.warn('[WeatherRepository] Firebase history fallback to API notice');
    }

    try {
      const res = await fetch('/api/telemetry');
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.history) && json.history.length > 0) {
          return json.history;
        } else if (json && (json.temperature !== undefined || json.temp !== undefined)) {
          return [{
            timestamp: json.timestamp || new Date().toISOString(),
            temperature: Number(json.temperature ?? json.temp ?? 0),
            humidity: Number(json.humidity ?? json.hum ?? 0),
            wind_speed: Number(json.wind_speed ?? json.windSpeed ?? 0),
            light_lux: Number(json.light_lux ?? json.lightLux ?? 0),
          }];
        }
      }
    } catch (err) {
      console.warn('[WeatherRepository] API history fetch notice:', err);
    }

    return [];
  }
}
