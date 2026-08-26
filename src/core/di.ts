import { MqttDataSource } from '../data/sources/MqttDataSource';
import { BmkgApiDataSource } from '../data/sources/BmkgApiDataSource';
import { FirebaseDataSource } from '../data/sources/FirebaseDataSource';
import { WeatherRepository } from '../data/repositories/WeatherRepository';
import { BmkgRepository } from '../data/repositories/BmkgRepository';
import { MqttService } from '../services/MqttService';
import { WeatherService } from '../services/WeatherService';

const mqttDataSource = new MqttDataSource();
const bmkgApiDataSource = new BmkgApiDataSource();
const firebaseDataSource = new FirebaseDataSource();

export const weatherRepository = new WeatherRepository(mqttDataSource, firebaseDataSource);
export const bmkgRepository = new BmkgRepository(bmkgApiDataSource);

export const mqttService = new MqttService(weatherRepository);
export const weatherService = new WeatherService(bmkgRepository);
