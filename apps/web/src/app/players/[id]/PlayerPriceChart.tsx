'use client';

import { useState, useTransition } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Activity, 
  Sparkles,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { PriceHistoryPoint, fetchPriceHistoryAction } from '../actions';

interface PlayerPriceChartProps {
  playerId: string;
  initialData: PriceHistoryPoint[];
  initialTimeframe?: '7d' | '30d' | 'season';
  baseValue: number;
}

type Timeframe = '7d' | '30d' | 'season';

export default function PlayerPriceChart({
  playerId,
  initialData,
  initialTimeframe = '7d',
  baseValue,
}: PlayerPriceChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>(initialTimeframe);
  const [data, setData] = useState<PriceHistoryPoint[]>(initialData);
  const [isPending, startTransition] = useTransition();

  const handleTimeframeChange = (tf: Timeframe) => {
    if (tf === timeframe) return;
    setTimeframe(tf);
    startTransition(async () => {
      const res = await fetchPriceHistoryAction(playerId, tf);
      if (res.success && res.data) {
        setData(res.data);
      }
    });
  };

  // Calculations for KPI summaries
  const startPoint = data[0];
  const endPoint = data[data.length - 1];
  const startVal = startPoint?.market_value || baseValue;
  const endVal = endPoint?.market_value || baseValue;
  const deltaVal = endVal - startVal;
  const deltaPct = startVal > 0 ? (deltaVal / startVal) * 100 : 0;
  const isPositive = deltaVal >= 0;

  const values = data.map((d) => d.market_value);
  const highVal = values.length > 0 ? Math.max(...values) : baseValue;
  const lowVal = values.length > 0 ? Math.min(...values) : baseValue;

  const strokeColor = isPositive ? '#00FF87' : '#F43F5E';
  const gradientId = `priceGrad_${isPositive ? 'up' : 'down'}`;

  return (
    <div className="bg-[#111827] border border-[#22304A] rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl">
      {/* Top Header: Title & Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#22304A] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#00FF87]" />
              Market Valuation Trajectory
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#161F30] border border-[#22304A] text-slate-300">
              {timeframe === '7d' ? '7-Day Close' : timeframe === '30d' ? '30-Day Trend' : 'Season GW 1-38'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Historical price points recalculated weekly via the Algorithmic Pricing Engine.
          </p>
        </div>

        {/* 7-day / 30-day / Season View Toggle */}
        <div className="inline-flex p-1 rounded-xl bg-[#0A0E17] border border-[#22304A] self-start sm:self-auto">
          {(
            [
              { id: '7d', label: '7-Day View' },
              { id: '30d', label: '30-Day View' },
              { id: 'season', label: 'Season View' },
            ] as const
          ).map((tab) => {
            const isActive = timeframe === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTimeframeChange(tab.id)}
                disabled={isPending}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  isActive
                    ? 'bg-[#00FF87] text-black shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#161F30]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Period Net Change */}
        <div className="p-3.5 rounded-xl bg-[#161F30] border border-[#22304A]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
            {timeframe === '7d' ? '7D Net Return' : timeframe === '30d' ? '30D Net Return' : 'Season Return'}
          </span>
          <div className="flex items-center gap-1.5">
            {isPositive ? (
              <ArrowUpRight className="w-4 h-4 text-[#00FF87]" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-[#F43F5E]" />
            )}
            <span
              className={`text-sm font-bold font-mono ${
                isPositive ? 'text-[#00FF87]' : 'text-[#F43F5E]'
              }`}
            >
              {isPositive ? '+' : ''}£{(deltaVal / 1000000).toFixed(1)}M ({isPositive ? '+' : ''}
              {deltaPct.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Period High */}
        <div className="p-3.5 rounded-xl bg-[#161F30] border border-[#22304A]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
            Period High
          </span>
          <span className="text-sm font-bold font-mono text-white">
            £{(highVal / 1000000).toFixed(1)}M
          </span>
        </div>

        {/* Period Low */}
        <div className="p-3.5 rounded-xl bg-[#161F30] border border-[#22304A]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
            Period Low
          </span>
          <span className="text-sm font-bold font-mono text-white">
            £{(lowVal / 1000000).toFixed(1)}M
          </span>
        </div>

        {/* Base Benchmark */}
        <div className="p-3.5 rounded-xl bg-[#161F30] border border-[#22304A]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
            Base Value Benchmark
          </span>
          <span className="text-sm font-bold font-mono text-slate-300">
            £{(baseValue / 1000000).toFixed(1)}M
          </span>
        </div>
      </div>

      {/* Recharts SVG Area Graph Container */}
      <div className="relative w-full h-[320px] pt-2">
        {isPending && (
          <div className="absolute inset-0 bg-[#111827]/60 backdrop-blur-xs flex items-center justify-center z-10 rounded-xl">
            <span className="text-xs font-mono text-[#00FF87] animate-pulse">
              Recalculating {timeframe.toUpperCase()} Curve...
            </span>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" vertical={false} />

            <XAxis
              dataKey="label"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#22304A' }}
            />

            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              tickFormatter={(val) => `£${(val / 1000000).toFixed(0)}M`}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="market_value"
              stroke={strokeColor}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
              dot={timeframe === '7d' ? { r: 3.5, fill: strokeColor, stroke: '#111827', strokeWidth: 2 } : false}
              activeDot={{ r: 6, fill: strokeColor, stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ==============================================================================
// Custom Dark Glassmorphism Tooltip
// ==============================================================================

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data: PriceHistoryPoint = payload[0].payload;
    const valFormatted = (data.market_value / 1000000).toFixed(2);
    const formPct = (data.form_factor * 100).toFixed(1);
    const formSign = data.form_factor >= 0 ? '+' : '';

    return (
      <div className="bg-[#0A0E17]/95 border border-[#22304A] p-3.5 rounded-xl shadow-2xl backdrop-blur-md text-xs font-mono space-y-2 min-w-[170px]">
        <div className="text-slate-400 font-semibold border-b border-[#22304A] pb-1 flex justify-between">
          <span>{data.label}</span>
          <span className="text-[10px] text-slate-500">
            {new Date(data.recorded_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Valuation:</span>
            <strong className="text-[#00FF87] font-bold text-sm">£{valFormatted}M</strong>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">Form Impact:</span>
            <span
              className={`font-bold ${
                data.form_factor >= 0 ? 'text-[#00FF87]' : 'text-[#F43F5E]'
              }`}
            >
              {formSign}
              {formPct}%
            </span>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">Match Rating:</span>
            <span className="text-slate-200 font-semibold">{data.match_rating.toFixed(2)}/10</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}
