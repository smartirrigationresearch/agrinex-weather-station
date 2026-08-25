/**
 * Exports data array as a formatted JSON file download
 */
export function downloadJson<T>(data: T[], filename: string = 'telemetry_log.json') {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports telemetry array as a CSV file download
 */
export function downloadCsv(data: any[], filename: string = 'telemetry_log.csv') {
  if (!data || data.length === 0) return;

  // Extract keys for CSV headers
  const headers = ['Waktu (ISO)', 'Waktu Display', 'Suhu (°C)', 'Kelembapan (%)', 'Kec. Angin (km/h)', 'Cahaya (Lux)'];
  
  const rows = data.map(item => [
    item.timestamp || '',
    item.displayTime || '',
    item.temperature ?? '',
    item.humidity ?? '',
    item.wind_speed ?? '',
    item.light_lux ?? ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(val => `"${val}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
