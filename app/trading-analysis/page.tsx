'use client';

import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';

export default function TradingAnalysisPage() {
  const stats = [
    {
      label: 'Volume 24h',
      value: '$1.24B',
      change: '+12.5%',
      isPositive: true,
      icon: DollarSign
    },
    {
      label: 'Total Trades',
      value: '45,892',
      change: '+8.3%',
      isPositive: true,
      icon: Activity
    },
    {
      label: 'Avg Spread',
      value: '0.09%',
      change: '-0.02%',
      isPositive: true,
      icon: TrendingDown
    },
    {
      label: 'Active Pairs',
      value: '82',
      change: '+5',
      isPositive: true,
      icon: TrendingUp
    },
  ];

  const topPairs = [
    { pair: 'BTC/USD', volume: '$456M', trades: 12450, avgSpread: '0.07%' },
    { pair: 'ETH/USD', volume: '$234M', trades: 8920, avgSpread: '0.05%' },
    { pair: 'SOL/USD', volume: '$123M', trades: 6780, avgSpread: '0.12%' },
    { pair: 'AVAX/USD', volume: '$89M', trades: 4560, avgSpread: '0.15%' },
    { pair: 'MATIC/USD', volume: '$67M', trades: 3890, avgSpread: '0.18%' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Trading Analysis</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-[#0f0f0f] rounded-xl border border-gray-800 p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">{stat.label}</p>
                <Icon className="w-4 h-4 text-gray-500" />
              </div>
              <p className="text-2xl font-bold mb-1">{stat.value}</p>
              <p className={`text-xs ${stat.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {stat.change}
              </p>
            </div>
          );
        })}
      </div>

      {/* Top Trading Pairs */}
      <div className="bg-[#0f0f0f] rounded-xl border border-gray-800 p-6">
        <h2 className="text-xl font-bold mb-4">Top Trading Pairs (24h)</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Pair</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Volume 24h</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Trades</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Avg Spread</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {topPairs.map((pair, index) => (
                <tr key={index} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-4 font-medium">{pair.pair}</td>
                  <td className="px-4 py-4 text-green-500">{pair.volume}</td>
                  <td className="px-4 py-4 text-gray-400">{pair.trades.toLocaleString()}</td>
                  <td className="px-4 py-4 text-gray-400">{pair.avgSpread}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <div className="mt-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20 p-8 text-center">
        <h3 className="text-xl font-bold mb-2">📊 Advanced Analytics Coming Soon</h3>
        <p className="text-gray-400">
          Graphiques avancés, corrélations, backtesting et plus encore...
        </p>
      </div>
    </div>
  );
}
