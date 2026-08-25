import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, cn } from './Card';
import { BarChart3 } from 'lucide-react';

interface ChartDataPoint {
  time: string;
  Field: number;
  BMKG: number;
}

type TimeRange = '1h' | '1d' | '1w' | '1y';

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  '1h': '1 Jam',
  '1d': '1 Hari',
  '1w': '1 Minggu',
  '1y': '1 Tahun',
};

export function ChartWidget({ data, title, fieldKey = 'Field', bmkgKey = 'BMKG', unit = '' }: { 
  data: ChartDataPoint[], 
  title: string,
  fieldKey?: string,
  bmkgKey?: string,
  unit?: string
}) {
  const [activeRange, setActiveRange] = useState<TimeRange>('1h');

  const slicedData = (() => {
    switch (activeRange) {
      case '1h': return data;
      case '1d': return data.slice(-20);
      case '1w': return data.slice(-15);
      case '1y': return data.slice(-10);
      default: return data;
    }
  })();

  const safeId = title.replace(/[^a-zA-Z0-9]/g, '');

  return (
    <Card className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <BarChart3 size={15} className="text-gray-800" />
            <h3 className="text-base font-bold text-gray-800">{title}</h3>
          </div>
          <p className="text-xs text-[var(--color-neo-text-muted)]">
            Perbandingan data sensor lapangan vs observasi BMKG
          </p>
        </div>
        {/* Time range tabs */}
        <div className="flex rounded-xl shadow-[var(--shadow-neo-pressed)] p-1 gap-0.5 self-start sm:self-auto">
          {(Object.keys(TIME_RANGE_LABELS) as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setActiveRange(range)}
              className={cn(
                "px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all duration-200 cursor-pointer",
                activeRange === range
                  ? "shadow-[var(--shadow-neo-sm)] text-gray-900 bg-[var(--color-neo-bg)]"
                  : "text-gray-400 hover:text-gray-700"
              )}
            >
              {TIME_RANGE_LABELS[range]}
            </button>
          ))}
        </div>
      </div>

      <div className="h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={slicedData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-f-${safeId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#111827" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#111827" stopOpacity={0.02}/>
              </linearGradient>
              <linearGradient id={`grad-b-${safeId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.02}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(163,177,198,0.3)" />
            <XAxis 
              dataKey="time" 
              stroke="#94a3b8" 
              tick={{ fontSize: 10 }} 
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              stroke="#94a3b8" 
              tick={{ fontSize: 10 }} 
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}${unit}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#e0e5ec', 
                borderRadius: '12px', 
                boxShadow: '4px 4px 8px rgba(163,177,198,0.5), -4px -4px 8px rgba(255,255,255, 0.5)',
                border: 'none',
                color: '#1f2937',
                fontSize: '12px',
                padding: '8px 14px'
              }} 
            />
            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              iconType="circle"
              iconSize={8}
            />
            <Area 
              type="monotone" 
              dataKey={fieldKey}
              name="Sensor Lapangan" 
              stroke="#111827" 
              strokeWidth={2.5} 
              fill={`url(#grad-f-${safeId})`}
              dot={false} 
              activeDot={{ r: 4, fill: '#111827' }}
            />
            <Area 
              type="monotone" 
              dataKey={bmkgKey}
              name="BMKG" 
              stroke="#94a3b8" 
              strokeWidth={2.5} 
              fill={`url(#grad-b-${safeId})`}
              dot={false} 
              activeDot={{ r: 4, fill: '#94a3b8' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
