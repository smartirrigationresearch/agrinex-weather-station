import type { BmkgForecastData, TomorrowForecast, BmkgApiResponse, BmkgCuacaEntry } from '../../core/types/bmkg.types';
import { LOCATION_CONFIG } from '../../core/config/mqtt.config';

const BMKG_API_BASE = 'https://api.bmkg.go.id/publik/prakiraan-cuaca';

// Cache untuk menghindari request berlebihan (BMKG limit: 60 req/menit/IP)
let cachedResponse: BmkgApiResponse | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 menit — BMKG update 2x sehari

export class BmkgApiDataSource {

  private async fetchFromApi(): Promise<BmkgApiResponse> {
    const now = Date.now();
    
    // Return cache jika masih valid
    if (cachedResponse && (now - cacheTimestamp) < CACHE_TTL_MS) {
      return cachedResponse;
    }

    const url = `${BMKG_API_BASE}?adm4=${LOCATION_CONFIG.bmkgAdm4}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`BMKG API error: ${response.status} ${response.statusText}`);
      }

      const data: BmkgApiResponse = await response.json();
      
      // Update cache
      cachedResponse = data;
      cacheTimestamp = now;

      return data;
    } catch (err) {
      // Jika ada cache lama, gunakan sebagai fallback
      if (cachedResponse) {
        console.warn('[BMKG] API request gagal, menggunakan cache:', err);
        return cachedResponse;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Mendapatkan data cuaca terkini berdasarkan jam terdekat dari BMKG.
   */
  async fetchCurrentObservation(): Promise<BmkgForecastData> {
    const apiData = await this.fetchFromApi();
    const todayCuaca = apiData.data[0]?.cuaca[0]; // Hari pertama (hari ini)

    if (!todayCuaca || todayCuaca.length === 0) {
      throw new Error('Tidak ada data cuaca hari ini dari BMKG');
    }

    // Cari entri cuaca terdekat dengan waktu sekarang
    const closest = this.findClosestEntry(todayCuaca);

    return {
      timestamp: closest.local_datetime,
      temperature: closest.t,
      humidity: closest.hu,
      wind_speed: closest.ws,
      weather_desc: closest.weather_desc,
      weather_icon: closest.image,
    };
  }

  /**
   * Mendapatkan prakiraan cuaca besok — agregasi dari semua entri besok.
   */
  async fetchTomorrowForecast(): Promise<TomorrowForecast> {
    const apiData = await this.fetchFromApi();
    const tomorrowCuaca = apiData.data[0]?.cuaca[1]; // Hari kedua (besok)

    if (!tomorrowCuaca || tomorrowCuaca.length === 0) {
      throw new Error('Tidak ada data prakiraan besok dari BMKG');
    }

    // Hitung agregasi dari semua entri besok
    const temps = tomorrowCuaca.map(e => e.t);
    const hums = tomorrowCuaca.map(e => e.hu);
    const winds = tomorrowCuaca.map(e => e.ws);
    const tccs = tomorrowCuaca.map(e => e.tcc);

    // Ambil kondisi cuaca paling sering (mode)
    const conditionCounts = new Map<string, number>();
    for (const entry of tomorrowCuaca) {
      conditionCounts.set(entry.weather_desc, (conditionCounts.get(entry.weather_desc) || 0) + 1);
    }
    let dominantCondition = tomorrowCuaca[0].weather_desc;
    let maxCount = 0;
    for (const [desc, count] of conditionCounts) {
      if (count > maxCount) {
        dominantCondition = desc;
        maxCount = count;
      }
    }

    // Parse tanggal besok dari local_datetime
    const tomorrowDateStr = tomorrowCuaca[0].local_datetime.split(' ')[0];
    const tomorrowDate = new Date(tomorrowDateStr + 'T00:00:00+07:00');
    const dateFormatted = tomorrowDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Gunakan tutupan awan rata-rata sebagai proxy probability hujan
    const avgTcc = tccs.reduce((a, b) => a + b, 0) / tccs.length;
    // Jika ada curah hujan (tp > 0) di salah satu entri, naikkan probability
    const hasRain = tomorrowCuaca.some(e => e.tp > 0);
    const rainProb = hasRain ? Math.min(90, avgTcc + 15) : Math.round(avgTcc * 0.6);

    return {
      date: dateFormatted,
      condition: dominantCondition,
      tempMin: Math.min(...temps),
      tempMax: Math.max(...temps),
      humidityMin: Math.min(...hums),
      humidityMax: Math.max(...hums),
      windSpeed: Number((winds.reduce((a, b) => a + b, 0) / winds.length).toFixed(1)),
      rainProbability: rainProb,
    };
  }

  /**
   * Cari entri cuaca terdekat dengan waktu lokal sekarang.
   */
  private findClosestEntry(entries: BmkgCuacaEntry[]): BmkgCuacaEntry {
    const now = new Date();
    let closest = entries[0];
    let minDiff = Infinity;

    for (const entry of entries) {
      // local_datetime format: "YYYY-MM-DD HH:mm:ss"
      const entryTime = new Date(entry.local_datetime.replace(' ', 'T') + '+07:00');
      const diff = Math.abs(now.getTime() - entryTime.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        closest = entry;
      }
    }

    return closest;
  }
}
