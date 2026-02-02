'use client';

import { BarChart3, TrendingUp, AlertCircle } from 'lucide-react';
import { useMarketData } from '@/lib/hooks/useMarketData';
import { useMemo } from 'react';

export default function OpenInterestPage() {
  const marketData = useMarketData();

  const openInterestData = useMemo(() => {
    return Object.entries(marketData).map(([token, exchanges]) => {
      const hlOI = exchanges.Hyperliquid?.openInterest || 0;
      const pxOI = exchanges.Paradex?.openInterest || 0;
      const total = hlOI + pxOI;

      return {
        pair: `${token}/USD`,
        paradex: pxOI,
        hyperliquid: hlOI,
        total: total,
        change24h: 'N/A', // 需要历史数据
        isPositive: true
      };
    }).filter(item => item.total > 0).sort((a, b) => b.total - a.total);
  }, [marketData]);

  const totalOI = openInterestData.reduce((acc, item) => acc + item.total, 0);
  const totalMarkets = openInterestData.length;

  const formatMillions = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
    return `$${val.toFixed(0)}`;
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-8 h-8" />
        <h1 className="text-3xl font-bold">Open Interest (Live)</h1>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20 p-6 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-2">Total Open Interest</p>
            <p className="text-4xl font-bold mb-1">{formatMillions(totalOI)}</p>
            <div className="flex items-center gap-2 text-green-500 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>Live Updates</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400 mb-2">Markets Tracked</p>
            <p className="text-2xl font-bold">{totalMarkets}</p>
          </div>
        </div>
      </div>

      {/* Alert */}
      {totalOI > 100000000 && ( // Example alert condition
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-500 mb-1">High Volatility Alert</p>
            <p className="text-xs text-gray-400">
              Total Open Interest is high. Expect volatility.
            </p>
          </div>
        </div>
      )}

      {/* Open Interest Table */}
      <div className="bg-[#0f0f0f] rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold">Open Interest par Exchange</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-black/30">
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Pair</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Paradex</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Hyperliquid</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {openInterestData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium">{item.pair}</td>
                  <td className="px-6 py-4 text-blue-400">{formatMillions(item.paradex)}</td>
                  <td className="px-6 py-4 text-orange-400">{formatMillions(item.hyperliquid)}</td>
                  <td className="px-6 py-4 font-bold">{formatMillions(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Card */}
      <div className="mt-6 bg-[#0f0f0f] rounded-lg border border-gray-800 p-4">
        <p className="text-xs text-gray-400">
          <strong>Note:</strong> L'open interest représente la valeur totale (USD) des contrats ouverts.
          Données en direct de Paradex (WebSocket) et Hyperliquid (REST Polling).
        </p>
      </div>

      {totalMarkets === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            Waiting for Open Interest data...
          </p>
        </div>
      )}
    </div>
  );
}
