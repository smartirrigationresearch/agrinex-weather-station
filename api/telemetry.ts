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
let telemetryHistory: TelemetryEntry[] = [];

const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'agrinex-f5ef8';

/**
 * Menyimpan data telemetry secara otomatis ke Cloud Firestore via REST API.
 * Menjamin data dari ESP8266 selalu tersimpan permanen di cloud meskipun browser ditutup.
 */
async function saveToFirestore(entry: TelemetryEntry): Promise<void> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/telemetry`;
  try {
    const payload = {
      fields: {
        timestamp: { stringValue: entry.timestamp },
        temperature: { doubleValue: Number(entry.temperature) },
        humidity: { doubleValue: Number(entry.humidity) },
        wind_speed: { doubleValue: Number(entry.wind_speed) },
        light_lux: { integerValue: Math.round(Number(entry.light_lux)) },
        createdAt: { timestampValue: new Date().toISOString() }
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      console.log('[API Serverless] ✓ Telemetry berhasil disimpan ke Firestore');
    } else {
      const errText = await res.text();
      console.warn('[API Serverless] Firestore REST save warning:', res.status, errText);
    }
  } catch (err) {
    console.error('[API Serverless] Error saving to Firestore:', err);
  }
}

/**
 * Mengambil history telemetry dari Cloud Firestore saat cold start (serverless RAM kosong).
 */
async function fetchHistoryFromFirestore(): Promise<TelemetryEntry[]> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;
  try {
    const queryPayload = {
      structuredQuery: {
        from: [{ collectionId: 'telemetry' }],
        limit: 50
      }
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queryPayload)
    });

    if (res.ok) {
      const data = (await res.json()) as any[];
      const entries: TelemetryEntry[] = [];
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item.document && item.document.fields) {
            const f = item.document.fields;
            entries.push({
              timestamp: f.timestamp?.stringValue || new Date().toISOString(),
              temperature: Number(f.temperature?.doubleValue ?? f.temperature?.integerValue ?? 0),
              humidity: Number(f.humidity?.doubleValue ?? f.humidity?.integerValue ?? 0),
              wind_speed: Number(f.wind_speed?.doubleValue ?? f.wind_speed?.integerValue ?? 0),
              light_lux: Number(f.light_lux?.integerValue ?? f.light_lux?.doubleValue ?? 0),
              updatedAt: Date.now()
            });
          }
        }
      }
      entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return entries;
    }
  } catch (err) {
    console.error('[API Serverless] Error fetching history from Firestore:', err);
  }
  return [];
}

export default async function handler(
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

  // Jika memory kosong karena cold start, coba restore dari Firestore
  if (telemetryHistory.length === 0) {
    const restored = await fetchHistoryFromFirestore();
    if (restored.length > 0) {
      telemetryHistory = restored;
    }
  }

  // POST Request: Dipanggil oleh ESP8266 setiap 15 menit
  if (req.method === 'POST') {
    let bodyData = '';
    req.on('data', chunk => {
      bodyData += chunk.toString();
    });

    req.on('end', async () => {
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

          // Strict deduplication check
          const isDuplicate = telemetryHistory.length > 0 && 
            (telemetryHistory[0].timestamp === newEntry.timestamp || 
             Math.abs(telemetryHistory[0].updatedAt - newEntry.updatedAt) < 60000);

          if (!isDuplicate) {
            telemetryHistory.unshift(newEntry);
            if (telemetryHistory.length > 100) {
              telemetryHistory = telemetryHistory.slice(0, 100);
            }
            // Simpan otomatis ke Firebase Firestore secara serverless & permanen
            saveToFirestore(newEntry).catch(err => console.error('[API] Save err:', err));
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

  // GET Request: Return history array without creating new timestamps
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({
    latest: telemetryHistory[0] || null,
    history: telemetryHistory,
    ...(telemetryHistory[0] || {})
  }));
}

