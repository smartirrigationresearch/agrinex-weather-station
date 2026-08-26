export interface BmkgForecastData {
  timestamp: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
  weather_desc: string;
  weather_icon: string;
}

export interface TomorrowForecast {
  date: string;
  condition: string;       // e.g. "Cerah Berawan"
  tempMin: number;
  tempMax: number;
  humidityMin: number;
  humidityMax: number;
  windSpeed: number;       // rata-rata km/h
  rainProbability: number; // dari tutupan awan (tcc) sebagai proxy
}

// Raw BMKG API response types
export interface BmkgApiResponse {
  lokasi: BmkgLokasi;
  data: BmkgDataEntry[];
}

export interface BmkgLokasi {
  adm1: string;
  adm2: string;
  adm3: string;
  adm4: string;
  provinsi: string;
  kotkab: string;
  kecamatan: string;
  desa: string;
  lon: number;
  lat: number;
  timezone: string;
}

export interface BmkgDataEntry {
  lokasi: BmkgLokasi & { type: string };
  cuaca: BmkgCuacaEntry[][];   // [hari][jam] — 3 hari x 8 entri per hari
}

export interface BmkgCuacaEntry {
  datetime: string;           // ISO 8601 UTC
  local_datetime: string;     // "YYYY-MM-DD HH:mm:ss" local
  t: number;                  // Suhu °C
  hu: number;                 // Kelembapan %
  ws: number;                 // Kecepatan angin km/h
  wd: string;                 // Arah angin dari (N, S, E, W, etc.)
  wd_to: string;              // Arah angin ke
  wd_deg: number;             // Arah angin derajat
  weather: number;            // Weather code
  weather_desc: string;       // Deskripsi cuaca (ID)
  weather_desc_en: string;    // Deskripsi cuaca (EN)
  tcc: number;                // Tutupan awan %
  tp: number;                 // Curah hujan
  vs: number;                 // Visibility (m)
  vs_text: string;            // Visibility text
  image: string;              // URL ikon cuaca
  analysis_date: string;      // Waktu analisis
  time_index: string;
}
