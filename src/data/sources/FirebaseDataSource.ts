import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp 
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
   * Menggunakan IndexedDB local cache agar tidak menghabiskan kuota Read.
   */
  async getRecentTelemetry(limitCount: number = 50): Promise<WeatherTelemetry[]> {
    try {
      const q = query(
        this.telemetryCollection, 
        orderBy('timestamp', 'desc'), 
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const logs: WeatherTelemetry[] = [];
      
      querySnapshot.forEach((doc) => {
        const d = doc.data();
        logs.push({
          timestamp: d.timestamp,
          temperature: d.temperature,
          humidity: d.humidity,
          wind_speed: d.wind_speed,
          light_lux: d.light_lux,
        });
      });

      return logs;
    } catch (error) {
      console.error('[Firebase] Gagal mengambil telemetry:', error);
      return [];
    }
  }
}
