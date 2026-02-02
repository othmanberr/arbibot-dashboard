'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import PriceChart from '@/components/PriceChart';
import { useCryptoPrices } from '@/lib/hooks/useCryptoPrices';
import { fetchHistoricalData } from '@/lib/api/fetchHistory';

export default function ArbitragePage() {
  const [selectedToken, setSelectedToken] = useState('BTC');
  const [exchanges, setExchanges] = useState({
    paradex: true,
    hyperliquid: true,
  });

  const [chartData, setChartData] = useState<Array<{
    time: string;
    paradex?: number;
    hyperliquid?: number;
  }>>([]);

  const { prices, status } = useCryptoPrices();
  // Use ref to access latest prices inside interval without resetting it
  const pricesRef = useRef(prices);
  // Also ref for selected token to avoid closure staleness
  const selectedTokenRef = useRef(selectedToken);

  useEffect(() => {
    pricesRef.current = prices;
  }, [prices]);

  // Effect to load historical data on mount or token change
  useEffect(() => {
    let mounted = true;
    selectedTokenRef.current = selectedToken;

    async function loadHistory() {
      // Clear chart logic is handled, but we want to show loading state or empty first
      setChartData([]);

      try {
        console.log(`Fetching history for ${selectedToken}...`);
        const history = await fetchHistoricalData(selectedToken);
        if (mounted && history.length > 0) {
          console.log(`Loaded ${history.length} historical points`);
          setChartData(history);
        }
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }

    loadHistory();

    return () => { mounted = false; };
  }, [selectedToken]);


  const currentTokenPrices = prices[selectedToken];

  // Accumulate chart data (Real-time updates)
  useEffect(() => {
    const updateChart = () => {
      const token = selectedTokenRef.current;
      const currentPrices = pricesRef.current[token];

      // Update if we have ANY data for the selected token
      if (currentPrices && (currentPrices.Hyperliquid || currentPrices.Paradex)) {
        const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

        setChartData(prev => {
          const newData = [
            ...prev,
            {
              time,
              paradex: currentPrices.Paradex?.last,
              hyperliquid: currentPrices.Hyperliquid?.last
            }
          ];
          // Keep last 60 points
          if (newData.length > 60) return newData.slice(newData.length - 60);
          return newData;
        });
      }
    };

    // Main 15s interval
    const interval = setInterval(updateChart, 15000);

    return () => {
      clearInterval(interval);
    };
  }, [selectedToken]); // Re-run when token changes (clears chart)

  const toggleExchange = (exchange: keyof typeof exchanges) => {
    setExchanges(prev => ({ ...prev, [exchange]: !prev[exchange] }));
  };

  // Calculate live stats
  const stats = useMemo(() => {
    if (chartData.length === 0) return {
      avgSpreadPct: "0.0000",
      avgSpreadVal: "0.00",
      maxSpreadPct: "0.0000",
      maxSpreadVal: "0.00",
      paradexHigherPct: "0.0",
      bestOpp: "0.0000"
    };

    let totalSpreadPct = 0;
    let totalSpreadVal = 0;
    let maxSpreadPct = 0;
    let maxSpreadVal = 0;
    let paradexHigherCount = 0;
    let count = 0;

    chartData.forEach(d => {
      if (d.paradex && d.hyperliquid) {
        const spreadVal = Math.abs(d.paradex - d.hyperliquid);
        const spreadPct = (spreadVal / d.paradex) * 100;

        totalSpreadPct += spreadPct;
        totalSpreadVal += spreadVal;

        if (spreadPct > maxSpreadPct) {
          maxSpreadPct = spreadPct;
          maxSpreadVal = spreadVal;
        }

        if (d.paradex > d.hyperliquid) {
          paradexHigherCount++;
        }

        count++;
      }
    });

    const isLowVal = selectedToken !== 'BTC' && selectedToken !== 'ETH' && selectedToken !== 'SOL';

    return {
      avgSpreadPct: count > 0 ? (totalSpreadPct / count).toFixed(4) : "0.0000",
      avgSpreadVal: count > 0 ? (totalSpreadVal / count).toFixed(isLowVal ? 4 : 2) : "0.00",
      maxSpreadPct: maxSpreadPct.toFixed(4),
      maxSpreadVal: maxSpreadVal.toFixed(isLowVal ? 4 : 2),
      paradexHigherPct: count > 0 ? ((paradexHigherCount / count) * 100).toFixed(1) : "0.0",
      bestOpp: maxSpreadPct.toFixed(4)
    };
  }, [chartData, selectedToken]);

  // Current Prices for Header
  const currentHL = currentTokenPrices?.Hyperliquid?.last || 0;
  const currentPX = currentTokenPrices?.Paradex?.last || 0;

  const TOKENS = ['BTC', 'ETH', 'SOL', 'AVAX', 'HYPE', 'MATIC'];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Arbitrage Dashboard</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-[#0f0f0f] rounded-xl border border-gray-800 p-6">

        {/* Token Selector */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-800 pb-4">
          {TOKENS.map(token => (
            <button
              key={token}
              onClick={() => setSelectedToken(token)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedToken === token
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
            >
              {token}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{selectedToken}/USD</h2>
              <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">Live Feed</span>
            </div>
            <div className="mt-1 flex gap-4 text-sm">
              <p className="text-orange-400">
                HL: ${currentHL.toFixed(selectedToken === 'BTC' || selectedToken === 'ETH' ? 2 : 4)}
                <span className={`ml-2 text-[10px] ${status.hyperliquid === 'connected' ? 'text-green-500' : 'text-red-500'}`}>
                  ● {status.hyperliquid}
                </span>
              </p>
              <p className="text-blue-400">
                PX: ${currentPX.toFixed(selectedToken === 'BTC' || selectedToken === 'ETH' ? 2 : 4)}
                <span className={`ml-2 text-[10px] ${status.paradex === 'connected' ? 'text-green-500' : 'text-red-500'}`}>
                  ● {status.paradex}
                </span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Avg Spread (Session)</p>
            <p className="text-xl font-bold text-green-500">{stats.avgSpreadPct}%</p>
            <p className="text-xs text-gray-500">Max: {stats.maxSpreadPct}%</p>
          </div>
        </div>

        {/* Exchange Filters */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-sm text-gray-400">Show exchanges:</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={exchanges.paradex}
              onChange={() => toggleExchange('paradex')}
              className="rounded"
            />
            <span className="text-sm text-blue-400">Paradex</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={exchanges.hyperliquid}
              onChange={() => toggleExchange('hyperliquid')}
              className="rounded"
            />
            <span className="text-sm text-orange-400">Hyperliquid</span>
          </label>
        </div>

        {/* Chart */}
        <div className="bg-black/30 rounded-lg border border-gray-800 p-4 mb-6">
          {chartData.length > 0 ? (
            <PriceChart data={chartData} exchanges={{ ...exchanges, lighter: false }} />
          ) : (
            <div className="h-[400px] flex items-center justify-center text-gray-500">
              Initializing real-time chart for {selectedToken}...
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#111] p-4 rounded-lg border border-gray-800 text-center">
            <p className="text-gray-400 text-sm font-semibold mb-1">Avg Spread</p>
            <p className="text-xl font-bold text-white">${stats.avgSpreadVal}</p>
          </div>
          <div className="bg-[#111] p-4 rounded-lg border border-gray-800 text-center">
            <p className="text-gray-400 text-sm font-semibold mb-1">Max Spread</p>
            <p className="text-xl font-bold text-white">${stats.maxSpreadVal}</p>
            <p className="text-xs text-gray-500">({stats.maxSpreadPct}%)</p>
          </div>
          <div className="bg-[#111] p-4 rounded-lg border border-gray-800 text-center">
            <p className="text-gray-400 text-sm font-semibold mb-1">Paradex Higher</p>
            <p className="text-xl font-bold text-white">{stats.paradexHigherPct}%</p>
          </div>
          <div className="bg-[#111] p-4 rounded-lg border border-gray-800 text-center">
            <p className="text-gray-400 text-sm font-semibold mb-1">Best Opportunity</p>
            <p className="text-xl font-bold text-white">{stats.bestOpp}%</p>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          * Chart shows history (1h) + real-time updates.
        </p>
      </div>
    </div>
  );
}
