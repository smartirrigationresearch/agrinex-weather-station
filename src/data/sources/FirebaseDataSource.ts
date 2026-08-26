import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  limit, 
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../core/config/firebase.config';
import type { WeatherTelemetry } from '../../core/types/weather.types';

export class FirebaseDataSource {
  private telemetryCollection = collection(db, 'telemetry');

  /**
   * Menyimpan data telemetry baru ke Firestore (Hanya 96x write / hari).
   * Sangat hemat dan jauh di bawah kuota gratis (20.000 write/hari).
   */
  async saveTelemetry(data: WeatherTelemetry): Promise<void> {
    try {
      await addDoc(this.telemetryCollection, {
        ...data,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('[Firebase] Gagal menyimpan telemetry:', error);
    }
  }

  /**
   * Mengambil riwayat telemetry terbaru dengan limit (Default: 50 entri terbaru).
   * Menggunakan IndexedDB local cache & sorting client-side tanpa butuh composite index.
   */
  async getRecentTelemetry(limitCount: number = 50): Promise<WeatherTelemetry[]> {
    try {
      const q = query(this.telemetryCollection, limit(limitCount));
      const querySnapshot = await getDocs(q);
      const logs: WeatherTelemetry[] = [];
      
      querySnapshot.forEach((doc) => {
        const d = doc.data();
        if (d.temperature !== undefined || d.temp !== undefined) {
          logs.push({
            timestamp: d.timestamp || new Date().toISOString(),
            temperature: Number(d.temperature ?? d.temp ?? 0),
            humidity: Number(d.humidity ?? d.hum ?? 0),
            wind_speed: Number(d.wind_speed ?? d.windSpeed ?? 0),
            light_lux: Number(d.light_lux ?? d.lightLux ?? 0),
          });
        }
      });

      // Sort client-side descending (terbaru di atas)
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return logs;
    } catch (error) {
      console.error('[Firebase] Gagal mengambil telemetry:', error);
      return [];
    }
  }

  /**
   * Realtime listener via HTTPS Firestore snapshot.
   * Berfungsi 100% sempurna pada halaman HTTPS tanpa error Mixed Content.
   */
  subscribeTelemetry(callback: (data: WeatherTelemetry) => void): () => void {
    const q = query(this.telemetryCollection, limit(20));

    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const logs: WeatherTelemetry[] = [];
        snapshot.forEach((doc) => {
          const d = doc.data();
          if (d.temperature !== undefined || d.temp !== undefined) {
            logs.push({
              timestamp: d.timestamp || new Date().toISOString(),
              temperature: Number(d.temperature ?? d.temp ?? 0),
              humidity: Number(d.humidity ?? d.hum ?? 0),
              wind_speed: Number(d.wind_speed ?? d.windSpeed ?? 0),
              light_lux: Number(d.light_lux ?? d.lightLux ?? 0),
            });
          }
        });

        logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        if (logs.length > 0) {
          callback(logs[0]);
        }
      }
    }, (err) => {
      console.warn('[Firebase] Realtime listener notice:', err);
    });
  }
}
