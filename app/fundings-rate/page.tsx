'use client';

import { useState, useMemo } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { useMarketData } from '@/lib/hooks/useMarketData';

export default function FundingsRatePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const marketData = useMarketData();

  // Transform hook data into array for the table/cards
  const fundingRates = useMemo(() => {
    return Object.entries(marketData).map(([token, exchanges]) => {
      const hlRate = exchanges.Hyperliquid?.fundingRate || 0;
      const pxRate = exchanges.Paradex?.fundingRate || 0;

      const diff = Math.abs(hlRate - pxRate);
      let strategy = 'N/A';
      if (hlRate > pxRate) strategy = 'Short Hyperliquid / Long Paradex';
      else if (pxRate > hlRate) strategy = 'Short Paradex / Long Hyperliquid';

      return {
        id: token,
        pair: `${token}/USD`,
        paradex: pxRate,
        hyperliquid: hlRate,
        apr: parseFloat(diff.toFixed(2)),
        strategy
      };
    }).filter(item => item.paradex !== 0 || item.hyperliquid !== 0);
  }, [marketData]);

  const topOpportunities = [...fundingRates].sort((a, b) => b.apr - a.apr).slice(0, 3);

  const filteredRates = fundingRates.filter(rate =>
    rate.pair.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8">
      {/* Header */}
      <h1 className="text-3xl font-bold mb-6">Fundings Rate (Live APR)</h1>

      {/* Search Bar */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search pairs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0f0f0f] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-gray-600"
          />
        </div>
        <span className="text-sm text-gray-400">{filteredRates.length} pairs found</span>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg text-sm hover:bg-gray-800 transition-colors">
          <RefreshCw className="w-4 h-4 animate-spin-slow" />
          Live
        </button>
      </div>

      {/* Top Opportunities */}
      {topOpportunities.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-2">Top Opportunities</h2>
          <p className="text-sm text-gray-400 mb-4">Best APR strategies available</p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {topOpportunities.map((rate, index) => (
              <div key={rate.id} className="relative">
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold z-10">
                  #{index + 1}
                </div>
                <div className="bg-[#0f0f0f] rounded-xl border border-gray-800 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{rate.pair}</h3>
                      <span className="text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded">
                        +{rate.apr}% APR
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex justify-between">
                      <span>Paradex</span>
                      <span className={rate.paradex > 0 ? "text-green-500" : "text-red-500"}>{rate.paradex.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hyperliquid</span>
                      <span className={rate.hyperliquid > 0 ? "text-green-500" : "text-red-500"}>{rate.hyperliquid.toFixed(2)}%</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <p className="text-xs text-gray-500 mb-1">Strategy</p>
                    <p className="text-sm font-medium">{rate.strategy}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#0f0f0f] rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Pair
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Paradex (APR)
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Hyperliquid (APR)
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Strategy
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Spread APR
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredRates.map((rate) => (
                <tr key={rate.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium">{rate.pair}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={rate.paradex > 0 ? 'text-green-500' : 'text-red-500'}>
                      {rate.paradex > 0 ? '+' : ''}{rate.paradex.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={rate.hyperliquid > 0 ? 'text-green-500' : 'text-red-500'}>
                      {rate.hyperliquid > 0 ? '+' : ''}{rate.hyperliquid.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-gray-400">{rate.strategy}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-green-500 font-bold">+{rate.apr}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* No results */}
      {filteredRates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            Waiting for funding data... <br />
            <span className="text-xs">Connecting to Hyperliquid & Paradex...</span>
          </p>
        </div>
      )}
    </div>
  );
}
