import mqtt from 'mqtt';
import type { MqttClient } from 'mqtt';
import { getMqttUrl, MQTT_CONFIG } from '../../core/config/mqtt.config';

export type MqttMessageCallback = (topic: string, payload: string) => void;

export class MqttDataSource {
  private client: MqttClient | null = null;
  private messageCallbacks: MqttMessageCallback[] = [];
  private connectionCallbacks: ((connected: boolean) => void)[] = [];

  connect(): void {
    if (this.client && this.client.connected) return;

    const url = getMqttUrl();
    try {
      this.client = mqtt.connect(url, {
        username: MQTT_CONFIG.username,
        password: MQTT_CONFIG.password,
        reconnectPeriod: 15000,
        connectTimeout: 5000,
      });

      this.client.on('connect', () => {
        console.log('[MQTT] Terhubung via', url);
        this.client?.subscribe(MQTT_CONFIG.topic);
        this.notifyConnectionState(true);
      });

      this.client.on('message', (topic, message) => {
        this.notifyMessage(topic, message.toString());
      });

      this.client.on('close', () => {
        this.notifyConnectionState(false);
      });

      this.client.on('error', (err) => {
        console.warn('[MQTT Notice] WS/WSS notice (Menggunakan Stream HTTPS Firebase):', err.message);
        this.notifyConnectionState(false);
      });
    } catch (err) {
      console.warn('[MQTT Notice] Gagal inisialisasi WS connection:', err);
      this.notifyConnectionState(false);
    }
  }

  disconnect(): void {
    if (this.client) {
      this.client.end();
      this.client = null;
    }
  }

  onMessage(callback: MqttMessageCallback): void {
    this.messageCallbacks.push(callback);
  }

  onConnectionStateChange(callback: (connected: boolean) => void): void {
    this.connectionCallbacks.push(callback);
  }

  private notifyMessage(topic: string, payload: string): void {
    this.messageCallbacks.forEach(cb => cb(topic, payload));
  }

  private notifyConnectionState(connected: boolean): void {
    this.connectionCallbacks.forEach(cb => cb(connected));
  }
}
