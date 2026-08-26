export const MQTT_CONFIG = {
  host: import.meta.env.VITE_MQTT_HOST || '127.0.0.1',
  port: parseInt(import.meta.env.VITE_MQTT_WS_PORT || '8083'),
  path: import.meta.env.VITE_MQTT_PATH || '/mqtt',
  username: import.meta.env.VITE_MQTT_USERNAME || 'guest',
  password: import.meta.env.VITE_MQTT_PASSWORD || 'guest',
  topic: import.meta.env.VITE_MQTT_TOPIC || 'weather/telemetry',
};

export const getMqttUrl = () => {
  return `ws://${MQTT_CONFIG.host}:${MQTT_CONFIG.port}${MQTT_CONFIG.path}`;
};

// Lokasi Node sensor & wilayah BMKG yang sinkron
export const LOCATION_CONFIG = {
  name: 'Kel. Purwawinangun, Kec. Kuningan',
  province: 'Kabupaten Kuningan, Jawa Barat',
  latitude: -6.9723261173,
  longitude: 108.4825838351,
  bmkgAdm4: '32.08.09.1006',
  bmkgStationId: 'BMKG Prakiraan Cuaca — Purwawinangun',
};