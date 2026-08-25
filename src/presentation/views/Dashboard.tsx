import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useWeatherRealtime } from '../../hooks/useWeatherRealtime';
import { useBmkgComparison } from '../../hooks/useBmkgComparison';
import { Card } from '../components/neumorphic/Card';
import { StatusBadge } from '../components/neumorphic/StatusBadge';
import { ChartWidget } from '../components/neumorphic/ChartWidget';
import { ArcGauge } from '../components/neumorphic/ArcGauge';
import { SkeletonCard, SkeletonGauge, SkeletonTable, Skeleton } from '../components/neumorphic/Skeleton';
import { LOCATION_CONFIG } from '../../core/config/mqtt.config';
import { downloadJson, downloadCsv } from '../../core/utils/export.utils';
import { 
  Thermometer, Droplets, Wind, Sun, 
  TrendingUp, TrendingDown, Minus, 
  ArrowUpDown, CloudSun, MapPin, 
  AlertTriangle, Radio, Calendar, CloudRain, Table,
  Clock, ChevronRight, CheckCircle2, FileJson, FileSpreadsheet
} from 'lucide-react';
import type { WeatherTelemetry } from '../../core/types/weather.types';
import type { BmkgForecastData } from '../../core/types/bmkg.types';

// --- Demo data generator for when MQTT is offline ---
function generateDemoData(): { field: WeatherTelemetry, bmkg: BmkgForecastData } {
  const now = new Date();
  const hour = now.getHours();
  const baseTempField = 26 + 6 * Math.sin((hour - 6) * Math.PI / 12) + (Math.random() - 0.5) * 1.5;
  const baseTempBmkg = 26 + 6 * Math.sin((hour - 6) * Math.PI / 12) + (Math.random() - 0.5) * 0.8;
  const baseHumField = 72 - 15 * Math.sin((hour - 6) * Math.PI / 12) + (Math.random() - 0.5) * 4;
  const baseHumBmkg = 70 - 15 * Math.sin((hour - 6) * Math.PI / 12) + (Math.random() - 0.5) * 2;
  const baseWindField = 3 + Math.random() * 8;
  const baseWindBmkg = 4 + Math.random() * 6;
  
  return {
    field: {
      timestamp: now.toISOString(),
      temperature: Number(baseTempField.toFixed(1)),
      humidity: Number(Math.max(30, Math.min(99, baseHumField)).toFixed(1)),
      wind_speed: Number(baseWindField.toFixed(1)),
      light_lux: Number((200 + Math.random() * 900).toFixed(0)),
    },
    bmkg: {
      timestamp: now.toISOString(),
      temperature: Number(baseTempBmkg.toFixed(1)),
      humidity: Number(Math.max(30, Math.min(99, baseHumBmkg)).toFixed(1)),
      wind_speed: Number(baseWindBmkg.toFixed(1)),
    }
  };
}

interface ChartPoint {
  time: string;
  Field: number;
  BMKG: number;
}

interface TelemetryLogEntry extends WeatherTelemetry {
  id: string;
  displayTime: string;
}

export function Dashboard() {
  const { data: mqttData, connected } = useWeatherRealtime();
  const { bmkgData: liveBmkg, tomorrowForecast } = useBmkgComparison(mqttData);
  
  const [fieldData, setFieldData] = useState<WeatherTelemetry | null>(null);
  const [bmkgData, setBmkgData] = useState<BmkgForecastData | null>(null);
  const [tempChart, setTempChart] = useState<ChartPoint[]>([]);
  const [humChart, setHumChart] = useState<ChartPoint[]>([]);
  const [windChart, setWindChart] = useState<ChartPoint[]>([]);
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLogEntry[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Real-time live clock (Jam Sekarang)
  const [currentTime, setCurrentTime] = useState<string>('');
  const [dayNumber, setDayNumber] = useState<string>('');
  const [dayName, setDayName] = useState<string>('');
  const [monthYearStr, setMonthYearStr] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
      setDayNumber(now.getDate().toString());
      setDayName(now.toLocaleDateString('id-ID', { weekday: 'long' }));
      setMonthYearStr(now.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Use real MQTT data when connected, otherwise simulate
  useEffect(() => {
    if (connected && mqttData) {
      setFieldData(mqttData);
      if (liveBmkg) setBmkgData(liveBmkg);
      setLastUpdate(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setIsLoading(false);
    }
  }, [connected, mqttData, liveBmkg]);

  // Demo data ticker when offline
  useEffect(() => {
    if (connected) return;
    const tick = () => {
      const demo = generateDemoData();
      setFieldData(demo.field);
      setBmkgData(demo.bmkg);
      setLastUpdate(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setIsLoading(false);
    };
    tick();
    const interval = setInterval(tick, 3000);
    return () => clearInterval(interval);
  }, [connected]);

  // Append chart & telemetry history log
  useEffect(() => {
    if (!fieldData || !bmkgData) return;
    const displayTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const appendChart = (prev: ChartPoint[], fieldVal: number, bmkgVal: number) => {
      const next = [...prev, { time: displayTime, Field: fieldVal, BMKG: bmkgVal }];
      return next.length > 25 ? next.slice(-25) : next;
    };

    setTempChart(prev => appendChart(prev, fieldData.temperature, bmkgData.temperature));
    setHumChart(prev => appendChart(prev, fieldData.humidity, bmkgData.humidity));
    setWindChart(prev => appendChart(prev, fieldData.wind_speed, bmkgData.wind_speed));

    setTelemetryLogs(prev => {
      const newEntry: TelemetryLogEntry = {
        ...fieldData,
        id: `${Date.now()}-${Math.random()}`,
        displayTime,
      };
      const updated = [newEntry, ...prev];
      return updated.slice(0, 20);
    });
  }, [fieldData, bmkgData]);

  // Memoized delta calculations for performance optimization
  const calcDelta = useCallback((a?: number, b?: number) => {
    if (a === undefined || b === undefined) return { value: 0, pct: 0 };
    const delta = a - b;
    const pct = b !== 0 ? (Math.abs(delta) / b) * 100 : 0;
    return { value: Number(delta.toFixed(1)), pct: Number(pct.toFixed(1)) };
  }, []);

  const tempDelta = useMemo(() => calcDelta(fieldData?.temperature, bmkgData?.temperature), [fieldData?.temperature, bmkgData?.temperature, calcDelta]);
  const humDelta = useMemo(() => calcDelta(fieldData?.humidity, bmkgData?.humidity), [fieldData?.humidity, bmkgData?.humidity, calcDelta]);
  const windDelta = useMemo(() => calcDelta(fieldData?.wind_speed, bmkgData?.wind_speed), [fieldData?.wind_speed, bmkgData?.wind_speed, calcDelta]);

  const feelsLike = useMemo(() => {
    return fieldData?.temperature ? (fieldData.temperature + 1.5).toFixed(0) : '25';
  }, [fieldData?.temperature]);

  const handleExportJson = useCallback(() => {
    downloadJson(telemetryLogs, `agrinex_weather_log_${Date.now()}.json`);
  }, [telemetryLogs]);

  const handleExportCsv = useCallback(() => {
    downloadCsv(telemetryLogs, `agrinex_weather_log_${Date.now()}.csv`);
  }, [telemetryLogs]);

  return (
    <div className="min-h-screen p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      
      {/* Top Status & SINGLE Live Clock Bar */}
      <div className="flex items-center justify-between animate-fade-in pt-1">
        <StatusBadge connected={connected} />
        
        {/* Single Live Clock Pill */}
        <div className="px-3.5 py-1.5 rounded-full neo-pressed flex items-center gap-2 text-xs font-mono font-bold text-gray-800">
          <Clock size={13} className="text-gray-700 animate-pulse" />
          <span>{currentTime || '19:32:17 WIB'}</span>
        </div>
      </div>

      {/* Header Section */}
      <header className="pt-2 pb-1 animate-fade-in" style={{ animationDelay: '0.05s' }}>
        <div className="flex justify-between items-start">
          {/* Left Side */}
          <div className="space-y-1">
            <span className="text-sm font-extrabold text-gray-900 lowercase tracking-tight block">today.</span>
            
            <h1 className="text-3xl sm:text-4xl font-light text-gray-700 tracking-tight leading-tight">
              Cerah Berawan
            </h1>
            
            <div className="text-xs text-gray-500 font-normal space-y-0.5 pt-1">
              <p>Humidity {fieldData?.humidity ?? 74.7}%</p>
              <p>Wind Speed {fieldData?.wind_speed ?? 3.8}km/h</p>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight pt-3">
              {LOCATION_CONFIG.name}
            </h2>
          </div>

          {/* Right Side */}
          <div className="flex flex-col items-center text-center shrink-0 pl-4">
            <CloudSun size={68} className="text-gray-800 stroke-[1.2]" />
            <span className="text-[11px] font-normal text-gray-400 mt-1.5">
              Terasa s/d {feelsLike}°C
            </span>
          </div>
        </div>
      </header>

      {/* Date & Location Widget Card */}
      <section className="animate-fade-in" style={{ animationDelay: '0.08s' }}>
        <Card className="!p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="text-5xl sm:text-6xl font-light text-gray-800 tabular-nums leading-none tracking-tight">
                {dayNumber || '25'}
              </div>
              <div>
                <p className="text-sm sm:text-base font-bold text-gray-800 leading-tight">{dayName || 'Selasa'}</p>
                <p className="text-xs text-gray-400 font-medium">{monthYearStr || 'Agu 2026'}</p>
              </div>
            </div>

            <div className="px-4 py-3 rounded-[20px] neo-pressed text-gray-700 flex flex-col justify-center text-right shrink-0">
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-[var(--color-neo-text-muted)]">BMKG REF</span>
              <span className="text-xs font-extrabold text-gray-800 truncate max-w-[140px] sm:max-w-[200px] mt-0.5">
                {LOCATION_CONFIG.bmkgStationId.split('/')[0]}
              </span>
              <span className="text-[9px] font-mono text-gray-600 font-bold mt-0.5">
                {LOCATION_CONFIG.latitude.toFixed(2)}, {LOCATION_CONFIG.longitude.toFixed(2)}
              </span>
            </div>
          </div>
        </Card>
      </section>

      {/* Main Highlights Grid: Skeleton vs Real Content */}
      {isLoading ? (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 animate-fade-in">
          <SkeletonGauge />
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {/* Arc Thermostat Gauge */}
          <Card className="lg:col-span-1 flex flex-col justify-between items-center text-center">
            <div className="w-full flex items-center justify-between border-b border-gray-300/30 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <Thermometer size={16} className="text-gray-700" />
                <span className="text-xs font-bold text-gray-700">Termometer Lapangan</span>
              </div>
              <div className="px-2 py-0.5 rounded-full text-[10px] font-bold neo-pressed text-gray-800">
                Auto Read
              </div>
            </div>

            <ArcGauge 
              value={fieldData?.temperature ?? 24.5} 
              min={10} 
              max={40} 
              unit="°C" 
              label="Suhu Udara Lapangan"
            />

            <div className="w-full pt-2 border-t border-gray-300/30 flex justify-between items-center text-xs text-gray-500 px-1">
              <span>Status: <strong className="text-gray-800 font-bold">Normal</strong></span>
              <span>Update: <strong className="text-gray-700">{lastUpdate || 'Sekarang'}</strong></span>
            </div>
          </Card>

          {/* 3 Metric Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <MetricCard title="Kelembapan" value={fieldData?.humidity} unit="%" icon={<Droplets size={24} />} subtitle="Relatif (RH)" />
            <MetricCard title="Kec. Angin" value={fieldData?.wind_speed} unit="km/h" icon={<Wind size={24} />} subtitle="Anemometer v1.3" />
            <MetricCard title="Intensitas Cahaya" value={fieldData?.light_lux} unit="lux" icon={<Sun size={24} />} subtitle="LDR / BH1750" />
          </div>
        </section>
      )}

      {/* Tomorrow Forecast & Comparison Matrix Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 animate-fade-in" style={{ animationDelay: '0.15s' }}>
        {/* Prakiraan Cuaca Besok */}
        <Card className="lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-300/40 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-700" />
                <h2 className="text-xs sm:text-sm font-bold text-gray-700">Prakiraan Cuaca Besok</h2>
              </div>
              <span className="text-[10px] neo-pressed text-gray-800 px-2 py-0.5 rounded-full font-bold">BMKG</span>
            </div>

            {tomorrowForecast ? (
              <div className="space-y-3">
                <p className="text-[11px] font-semibold text-gray-500">{tomorrowForecast.date}</p>
                
                <div className="flex items-center gap-3 p-3 rounded-2xl neo-pressed">
                  <CloudRain size={32} className="text-gray-800 shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-gray-800 leading-tight">{tomorrowForecast.condition}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Peluang Hujan: <span className="font-bold text-gray-900">{tomorrowForecast.rainProbability}%</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl neo-pressed">
                    <span className="text-[9px] text-gray-400 block font-bold uppercase">Suhu Min/Max</span>
                    <span className="font-extrabold text-gray-800 text-xs sm:text-sm">{tomorrowForecast.tempMin}° - {tomorrowForecast.tempMax}°C</span>
                  </div>
                  <div className="p-2.5 rounded-xl neo-pressed">
                    <span className="text-[9px] text-gray-400 block font-bold uppercase">Kelembapan</span>
                    <span className="font-extrabold text-gray-800 text-xs sm:text-sm">{tomorrowForecast.humidityMin}% - {tomorrowForecast.humidityMax}%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-16 w-full rounded-2xl" />
              </div>
            )}
          </div>

          <div className="pt-2 text-[10px] text-gray-400 border-t border-gray-300/30 mt-3">
            Wilayah: {LOCATION_CONFIG.name}
          </div>
        </Card>

        {/* Responsive Comparison Section */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ArrowUpDown size={16} className="text-gray-700" />
              <h2 className="text-xs sm:text-base font-bold text-gray-700">Perbandingan Real-time Sensor vs BMKG</h2>
            </div>
            <span className="text-[10px] text-gray-400 font-semibold uppercase hidden sm:inline">Live Sync</span>
          </div>

          {isLoading ? (
            <SkeletonTable />
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="text-[var(--color-neo-text-muted)] text-[10px] sm:text-xs uppercase tracking-wider border-b border-gray-300/40">
                      <th className="text-left py-2 pr-2 font-semibold">Parameter</th>
                      <th className="text-center py-2 px-2 font-semibold">
                        <span className="inline-flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-gray-900"></span> Sensor
                        </span>
                      </th>
                      <th className="text-center py-2 px-2 font-semibold">
                        <span className="inline-flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-gray-400"></span> BMKG
                        </span>
                      </th>
                      <th className="text-center py-2 px-2 font-semibold">Delta</th>
                      <th className="text-center py-2 pl-2 font-semibold">Error %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-300/30">
                    <ComparisonRow label="Suhu (°C)" fieldVal={fieldData?.temperature} bmkgVal={bmkgData?.temperature} delta={tempDelta} />
                    <ComparisonRow label="Kelembapan (%)" fieldVal={fieldData?.humidity} bmkgVal={bmkgData?.humidity} delta={humDelta} />
                    <ComparisonRow label="Kec. Angin (km/h)" fieldVal={fieldData?.wind_speed} bmkgVal={bmkgData?.wind_speed} delta={windDelta} />
                  </tbody>
                </table>
              </div>

              {/* Mobile Responsive Cards View */}
              <div className="sm:hidden space-y-2.5">
                <MobileComparisonCard label="Suhu (°C)" fieldVal={fieldData?.temperature} bmkgVal={bmkgData?.temperature} delta={tempDelta} icon={<Thermometer size={14} className="text-gray-700" />} />
                <MobileComparisonCard label="Kelembapan (%)" fieldVal={fieldData?.humidity} bmkgVal={bmkgData?.humidity} delta={humDelta} icon={<Droplets size={14} className="text-gray-700" />} />
                <MobileComparisonCard label="Kec. Angin (km/h)" fieldVal={fieldData?.wind_speed} bmkgVal={bmkgData?.wind_speed} delta={windDelta} icon={<Wind size={14} className="text-gray-700" />} />
              </div>
            </>
          )}

          {!connected && (
            <p className="flex items-center gap-1 text-[10px] text-[var(--color-neo-text-muted)] mt-3 pt-2 border-t border-gray-300/30">
              <AlertTriangle size={11} className="text-gray-500 shrink-0" />
              MQTT offline — data simulasi BMKG.
            </p>
          )}
        </Card>
      </section>

      {/* Charts Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <ChartWidget data={tempChart} title="Perbandingan Suhu" unit="°C" />
        <ChartWidget data={humChart} title="Perbandingan Kelembapan" unit="%" />
      </section>
      <section className="animate-fade-in" style={{ animationDelay: '0.35s' }}>
        <ChartWidget data={windChart} title="Perbandingan Kecepatan Angin" unit=" km/h" />
      </section>

      {/* Full Telemetry Log Table Section + EXPORT BUTTONS */}
      <section className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Table size={16} className="text-gray-700" />
              <h2 className="text-xs sm:text-base font-bold text-gray-700">Tabel Log Monitoring Sensor</h2>
            </div>
            
            {/* Export Buttons */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button 
                onClick={handleExportJson}
                className="px-3 py-1.5 rounded-xl neo-pressed hover:bg-gray-200/60 active:scale-95 transition-all text-[11px] font-bold text-gray-700 flex items-center gap-1.5 cursor-pointer"
              >
                <FileJson size={14} className="text-gray-700" />
                <span>Export JSON</span>
              </button>

              <button 
                onClick={handleExportCsv}
                className="px-3 py-1.5 rounded-xl neo-pressed hover:bg-gray-200/60 active:scale-95 transition-all text-[11px] font-bold text-gray-700 flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet size={14} className="text-gray-700" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {isLoading ? (
            <SkeletonTable />
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto -mx-1">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[var(--color-neo-text-muted)] uppercase tracking-wider text-[9px] sm:text-[11px] border-b border-gray-300/40">
                      <th className="text-left py-2 px-2 font-semibold">Waktu</th>
                      <th className="text-center py-2 px-2 font-semibold">Suhu</th>
                      <th className="text-center py-2 px-2 font-semibold">Kelembapan</th>
                      <th className="text-center py-2 px-2 font-semibold">Kec. Angin</th>
                      <th className="text-center py-2 px-2 font-semibold">Cahaya</th>
                      <th className="text-center py-2 px-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-300/30">
                    {telemetryLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/40 transition-colors">
                        <td className="py-2 px-2 font-mono text-gray-600 whitespace-nowrap">{log.displayTime}</td>
                        <td className="py-2 px-2 text-center font-bold text-gray-800 tabular-nums whitespace-nowrap">{log.temperature.toFixed(1)}°C</td>
                        <td className="py-2 px-2 text-center font-bold text-gray-800 tabular-nums whitespace-nowrap">{log.humidity.toFixed(1)}%</td>
                        <td className="py-2 px-2 text-center font-bold text-gray-800 tabular-nums whitespace-nowrap">{log.wind_speed.toFixed(1)}km/h</td>
                        <td className="py-2 px-2 text-center font-bold text-gray-800 tabular-nums whitespace-nowrap">{log.light_lux}lx</td>
                        <td className="py-2 px-2 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold neo-pressed text-gray-700">
                            <CheckCircle2 size={10} className="text-gray-800" /> OK
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Telemetry List Cards */}
              <div className="sm:hidden space-y-2">
                {telemetryLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-2xl neo-pressed space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono text-gray-600 font-bold">{log.displayTime}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-gray-200/60 text-gray-700">
                        <CheckCircle2 size={10} className="text-gray-800" /> OK
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                      <div className="p-1 rounded-lg bg-gray-200/40">
                        <span className="text-gray-400 block">Suhu</span>
                        <span className="font-bold text-gray-800">{log.temperature.toFixed(1)}°C</span>
                      </div>
                      <div className="p-1 rounded-lg bg-gray-200/40">
                        <span className="text-gray-400 block">Lembap</span>
                        <span className="font-bold text-gray-800">{log.humidity.toFixed(1)}%</span>
                      </div>
                      <div className="p-1 rounded-lg bg-gray-200/40">
                        <span className="text-gray-400 block">Angin</span>
                        <span className="font-bold text-gray-800">{log.wind_speed.toFixed(1)}k</span>
                      </div>
                      <div className="p-1 rounded-lg bg-gray-200/40">
                        <span className="text-gray-400 block">Cahaya</span>
                        <span className="font-bold text-gray-800">{log.light_lux}lx</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </section>

      {/* Footer */}
      <footer className="text-center text-[10px] text-[var(--color-neo-text-muted)] pt-4 pb-2">
        Agrinex Weather Station Dashboard v1.0 — Data diperbarui setiap 3 detik
      </footer>
    </div>
  );
}

// ------- Sub-components -------

function MetricCard({ title, value, unit, icon, subtitle }: { 
  title: string, value?: number, unit: string, icon: React.ReactNode, subtitle?: string
}) {
  return (
    <Card className="flex items-center justify-between p-3.5 sm:p-4 hover:shadow-[var(--shadow-neo-pressed)] cursor-default transition-all duration-300">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center neo-pressed shrink-0 text-gray-700">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-neo-text-muted)]">{title}</p>
          {subtitle && <p className="text-[9px] text-gray-400">{subtitle}</p>}
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg sm:text-2xl font-extrabold text-gray-800 tabular-nums">
              {value !== undefined ? value.toFixed(1) : '--'}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-gray-500">{unit}</span>
          </div>
        </div>
      </div>
      <ChevronRight size={16} className="text-gray-400 shrink-0" />
    </Card>
  );
}

function ComparisonRow({ label, fieldVal, bmkgVal, delta }: {
  label: string,
  fieldVal?: number,
  bmkgVal?: number,
  delta: { value: number, pct: number }
}) {
  const DeltaIcon = delta.value > 0.3 ? TrendingUp : delta.value < -0.3 ? TrendingDown : Minus;

  return (
    <tr className="hover:bg-white/30 transition-colors text-xs sm:text-sm">
      <td className="py-2.5 pr-2 font-medium text-gray-700">{label}</td>
      <td className="py-2.5 px-2 text-center font-bold text-gray-900 tabular-nums whitespace-nowrap">
        {fieldVal !== undefined ? fieldVal.toFixed(1) : '--'}
      </td>
      <td className="py-2.5 px-2 text-center font-bold text-gray-500 tabular-nums whitespace-nowrap">
        {bmkgVal !== undefined ? bmkgVal.toFixed(1) : '--'}
      </td>
      <td className="py-2.5 px-2 text-center font-bold tabular-nums whitespace-nowrap text-gray-700">
        <span className="inline-flex items-center gap-0.5">
          <DeltaIcon size={12} />
          {delta.value > 0 ? '+' : ''}{delta.value}
        </span>
      </td>
      <td className="py-2.5 pl-2 text-center font-semibold tabular-nums whitespace-nowrap text-gray-600">
        {delta.pct}%
      </td>
    </tr>
  );
}

function MobileComparisonCard({ label, fieldVal, bmkgVal, delta, icon }: {
  label: string,
  fieldVal?: number,
  bmkgVal?: number,
  delta: { value: number, pct: number },
  icon: React.ReactNode
}) {
  const DeltaIcon = delta.value > 0.3 ? TrendingUp : delta.value < -0.3 ? TrendingDown : Minus;

  return (
    <div className="p-3 rounded-2xl neo-pressed flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-xs font-bold text-gray-700">{label}</span>
        </div>
        <span className="text-xs font-bold tabular-nums flex items-center gap-0.5 text-gray-700">
          <DeltaIcon size={11} />
          Δ {delta.value > 0 ? '+' : ''}{delta.value} ({delta.pct}%)
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded-xl bg-gray-300/30 flex justify-between items-center">
          <span className="text-[10px] text-gray-500 font-medium">⚫ Sensor</span>
          <span className="font-extrabold text-gray-900 tabular-nums">{fieldVal !== undefined ? fieldVal.toFixed(1) : '--'}</span>
        </div>
        <div className="p-2 rounded-xl bg-gray-200/50 flex justify-between items-center">
          <span className="text-[10px] text-gray-500 font-medium">⚪ BMKG</span>
          <span className="font-extrabold text-gray-600 tabular-nums">{bmkgVal !== undefined ? bmkgVal.toFixed(1) : '--'}</span>
        </div>
      </div>
    </div>
  );
}
