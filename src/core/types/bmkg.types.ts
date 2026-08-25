export interface BmkgForecastData {
  timestamp: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
}

export interface TomorrowForecast {
  date: string;
  condition: string; // e.g. "Cerah Berawan", "Hujan Ringan"
  tempMin: number;
  tempMax: number;
  humidityMin: number;
  humidityMax: number;
  windSpeed: number;
  rainProbability: number;
}
