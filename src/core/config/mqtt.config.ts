export const MQTT_CONFIG = {
  host: import.meta.env.VITE_MQTT_HOST || '144.217.86.1',
  port: parseInt(import.meta.env.VITE_MQTT_WS_PORT || '8083'),
  path: import.meta.env.VITE_MQTT_PATH || '/mqtt',
  username: import.meta.env.VITE_MQTT_USERNAME || 'ghiffa',
  password: import.meta.env.VITE_MQTT_PASSWORD || 'secret404!',
  topic: import.meta.env.VITE_MQTT_TOPIC || 'weather/telemetry',
};

export const getMqttUrl = () => {
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const protocol = import.meta.env.VITE_MQTT_PROTOCOL || (isHttps ? 'wss' : 'ws');
  const defaultPort = protocol === 'wss' ? 8084 : 8083;
  const port = import.meta.env.VITE_MQTT_WS_PORT ? parseInt(import.meta.env.VITE_MQTT_WS_PORT) : defaultPort;

  return `${protocol}://${MQTT_CONFIG.host}:${port}${MQTT_CONFIG.path}`;
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