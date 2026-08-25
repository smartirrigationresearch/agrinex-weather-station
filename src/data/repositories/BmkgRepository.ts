import type { BmkgForecastData } from '../../core/types/bmkg.types';
import { BmkgApiDataSource } from '../sources/BmkgApiDataSource';

export interface IBmkgRepository {
  getLatestObservation(): Promise<BmkgForecastData>;
  getTomorrowForecast(): Promise<import('../../core/types/bmkg.types').TomorrowForecast>;
}

export class BmkgRepository implements IBmkgRepository {
  private apiSource: BmkgApiDataSource;

  constructor(apiSource: BmkgApiDataSource) {
    this.apiSource = apiSource;
  }

  async getLatestObservation(): Promise<BmkgForecastData> {
    return this.apiSource.fetchCurrentObservation();
  }

  async getTomorrowForecast(): Promise<import('../../core/types/bmkg.types').TomorrowForecast> {
    return this.apiSource.fetchTomorrowForecast();
  }
}
