import type { BmkgForecastData } from '../../core/types/bmkg.types';

export class BmkgApiDataSource {
  // We mock the BMKG data since there is no open JSON CORS API natively available.
  // In production, this would point to a proxy server (e.g. your own Laravel backend).
  
  private mockBaseTemp = 28.0;
  private mockBaseHum = 70.0;
  private mockBaseWind = 5.0;

  async fetchCurrentObservation(): Promise<BmkgForecastData> {
    // Add some random drift to simulate live data
    this.mockBaseTemp += (Math.random() - 0.5) * 0.5;
    this.mockBaseHum += (Math.random() - 0.5) * 2;
    this.mockBaseWind += (Math.random() - 0.5) * 1;

    return {
      timestamp: new Date().toISOString(),
      temperature: Number(this.mockBaseTemp.toFixed(1)),
      humidity: Number(this.mockBaseHum.toFixed(1)),
      wind_speed: Math.max(0, Number(this.mockBaseWind.toFixed(1))),
    };
  }

  async fetchTomorrowForecast(): Promise<import('../../core/types/bmkg.types').TomorrowForecast> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
      date: tomorrow.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      condition: 'Cerah Berawan dengan Potensi Hujan Ringan',
      tempMin: 22.0,
      tempMax: 30.5,
      humidityMin: 65,
      humidityMax: 92,
      windSpeed: 12.5,
      rainProbability: 40,
    };
  }
}
