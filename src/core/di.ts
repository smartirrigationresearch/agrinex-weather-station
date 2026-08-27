import { BmkgApiDataSource } from '../data/sources/BmkgApiDataSource';
import { FirebaseDataSource } from '../data/sources/FirebaseDataSource';
import { WeatherRepository } from '../data/repositories/WeatherRepository';
import { BmkgRepository } from '../data/repositories/BmkgRepository';
import { WeatherService } from '../services/WeatherService';

const bmkgApiDataSource = new BmkgApiDataSource();
const firebaseDataSource = new FirebaseDataSource();

export const weatherRepository = new WeatherRepository(firebaseDataSource);
export const bmkgRepository = new BmkgRepository(bmkgApiDataSource);

export const weatherService = new WeatherService(bmkgRepository);
