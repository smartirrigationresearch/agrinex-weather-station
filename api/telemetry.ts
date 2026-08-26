import type { IncomingMessage, ServerResponse } from 'http';

interface TelemetryEntry {
  timestamp: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
  light_lux: number;
  updatedAt: number;
}

// Global in-memory storage for 15-minute telemetry logs
let telemetryHistory: TelemetryEntry[] = [
  {
    timestamp: new Date().toISOString(),
    temperature: 27.4,
    humidity: 76.8,
    wind_speed: 8.4,
    light_lux: 54612,
    updatedAt: Date.now()
  }
];

export default function handler(
  req: IncomingMessage & { body?: any; method?: string }, 
  res: ServerResponse
) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  // POST Request: Hanya dipanggil oleh ESP8266 saat ada pengiriman data baru per 15 menit
  if (req.method === 'POST') {
    let bodyData = '';
    req.on('data', chunk => {
      bodyData += chunk.toString();
    });

    req.on('end', () => {
      try {
        const body = bodyData ? JSON.parse(bodyData) : req.body;
        if (body && (body.temperature !== undefined || body.temp !== undefined)) {
          const newEntry: TelemetryEntry = {
            timestamp: body.timestamp || new Date().toISOString(),
            temperature: Number(body.temperature ?? body.temp ?? 0),
            humidity: Number(body.humidity ?? body.hum ?? 0),
            wind_speed: Number(body.wind_speed ?? body.windSpeed ?? 0),
            light_lux: Number(body.light_lux ?? body.lightLux ?? 0),
            updatedAt: Date.now()
          };

          // Cegah duplikasi jika timestamp persis sama
          const isDuplicate = telemetryHistory.length > 0 && 
            (telemetryHistory[0].timestamp === newEntry.timestamp || 
             Math.abs(telemetryHistory[0].updatedAt - newEntry.updatedAt) < 10000);

          if (!isDuplicate) {
            telemetryHistory.unshift(newEntry);
            if (telemetryHistory.length > 100) {
              telemetryHistory = telemetryHistory.slice(0, 100);
            }
          } else {
            telemetryHistory[0] = newEntry;
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ status: 'ok', latest: newEntry, history: telemetryHistory }));
        }
      } catch (err) {
        console.error('[API] Error parsing POST payload:', err);
      }
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Invalid payload' }));
    });
    return;
  }

  // GET Request: Murni MENGAMBIL data tanpa pernah menambah baris baru!
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({
    latest: telemetryHistory[0] || null,
    history: telemetryHistory,
    ...(telemetryHistory[0] || {})
  }));
}
