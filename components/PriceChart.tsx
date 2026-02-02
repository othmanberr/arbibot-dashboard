'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PriceChartProps {
  data: Array<{
    time: string;
    paradex?: number;
    hyperliquid?: number;
    lighter?: number;
  }>;
  exchanges: {
    paradex: boolean;
    hyperliquid: boolean;
    lighter: boolean;
  };
}

export default function PriceChart({ data, exchanges }: PriceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis
          dataKey="time"
          stroke="#666"
          tick={{ fill: '#999' }}
        />
        <YAxis
          stroke="#666"
          tick={{ fill: '#999' }}
          domain={['dataMin', 'dataMax']}
          padding={{ top: 50, bottom: 50 }}
          tickFormatter={(value) => value < 1 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px'
          }}
          labelStyle={{ color: '#999' }}
        />
        <Legend />

        {exchanges.paradex && (
          <Line
            type="monotone"
            dataKey="paradex"
            stroke="#3b82f6"
            name="Paradex"
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#3b82f6' }}
            activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff' }}
          />
        )}

        {exchanges.hyperliquid && (
          <Line
            type="monotone"
            dataKey="hyperliquid"
            stroke="#f59e0b"
            name="Hyperliquid"
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#f59e0b' }}
            activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff' }}
          />
        )}

        {exchanges.lighter && (
          <Line
            type="monotone"
            dataKey="lighter"
            stroke="#8b5cf6"
            name="Lighter"
            strokeWidth={2}
            dot={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
