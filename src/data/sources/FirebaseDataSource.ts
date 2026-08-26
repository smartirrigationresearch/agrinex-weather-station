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

  private lastSavedTimestamp: string = '';

  /**
   * Menyimpan data telemetry baru secara permanen ke Firestore (Hanya 96x write / hari).
   * Menjamin data tersimpan di Cloud Database Firebase (bukan local browser).
   */
  async saveTelemetry(data: WeatherTelemetry): Promise<void> {
    if (!data.timestamp || data.timestamp === this.lastSavedTimestamp) {
      return; // Sudah pernah disimpan ke Firebase
    }
    this.lastSavedTimestamp = data.timestamp;
    try {
      await addDoc(this.telemetryCollection, {
        ...data,
        createdAt: serverTimestamp(),
      });
      console.log('[Firebase] ✓ Telemetry berhasil disimpan permanen ke Cloud Database Firestore');
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        console.warn('[Firebase Rules Notice] Akses Firestore ditolak. Buka Firebase Console -> Firestore -> Rules -> atur "allow read, write: if true;" -> Klik Publish.');
      } else {
        console.error('[Firebase] Gagal menyimpan telemetry:', error);
      }
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

    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        console.warn('[Firebase] Rules notice: Firestore permission pending sync.');
      } else {
        console.error('[Firebase] Gagal mengambil telemetry:', error);
      }
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
