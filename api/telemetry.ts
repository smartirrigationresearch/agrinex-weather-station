import type { IncomingMessage, ServerResponse } from 'http';

// Store last telemetry in memory across serverless warm instances
let cachedTelemetry = {
  timestamp: new Date().toISOString(),
  temperature: 27.4,
  humidity: 76.5,
  wind_speed: 8.4,
  light_lux: 54612,
  updatedAt: Date.now()
};

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

  if (req.method === 'POST') {
    let bodyData = '';
    req.on('data', chunk => {
      bodyData += chunk.toString();
    });

    req.on('end', () => {
      try {
        const body = bodyData ? JSON.parse(bodyData) : req.body;
        if (body && (body.temperature !== undefined || body.temp !== undefined)) {
          cachedTelemetry = {
            timestamp: body.timestamp || new Date().toISOString(),
            temperature: Number(body.temperature ?? body.temp ?? 0),
            humidity: Number(body.humidity ?? body.hum ?? 0),
            wind_speed: Number(body.wind_speed ?? body.windSpeed ?? 0),
            light_lux: Number(body.light_lux ?? body.lightLux ?? 0),
            updatedAt: Date.now()
          };
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ status: 'ok', data: cachedTelemetry }));
        }
      } catch (err) {
        console.error('Failed to parse POST body:', err);
      }
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Invalid payload' }));
    });
    return;
  }

  // GET request: Return cached telemetry
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify(cachedTelemetry));
}
