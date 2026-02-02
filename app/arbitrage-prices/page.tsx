'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import OpportunityCard from '@/components/OpportunityCard';
import TickerTape from '@/components/TickerTape'; // Import
import { RefreshCw, Settings } from 'lucide-react';
import { useCryptoPrices } from '@/lib/hooks/useCryptoPrices';
import { usePaperTrading } from '@/lib/hooks/usePaperTrading';
import PaperTradingPanel from '@/components/PaperTradingPanel';
import SettingsModal from '@/components/SettingsModal';

export default function ArbitragePricesPage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tokens, setTokens] = useState({
    BTC: true,
    ETH: true,
    BNB: true,
    HYPE: true,
    SOL: true,
  });

  const [refreshRate, setRefreshRate] = useState('5000'); // Default 5 sec

  // Live Prices
  const { prices } = useCryptoPrices();

  // 1. Calculate Raw Opportunities
  const rawOpportunities = useMemo(() => {
    const opps = [];
    let idCounter = 1;
    const allTokens = Object.keys(tokens);

    for (const token of allTokens) {
      const tokenPrices = prices[token];
      if (!tokenPrices || !tokenPrices.Hyperliquid || !tokenPrices.Paradex) continue;

      const hl = tokenPrices.Hyperliquid;
      const px = tokenPrices.Paradex;

      // Strategy 1: Long HL, Short Px
      const strategy1Profit = px.bid - hl.ask;
      // Strategy 2: Long Px, Short HL
      const strategy2Profit = hl.bid - px.ask;

      let bestStrategy = '';
      let profit = 0;
      let spreadPct = 0;
      let isDirect = false;
      let longEx, shortEx;
      let direction: 'LongHL_ShortPx' | 'LongPx_ShortHL';

      if (strategy1Profit > strategy2Profit) {
        profit = strategy1Profit;
        bestStrategy = 'Long Hyperliquid / Short Paradex';
        longEx = { name: 'Hyperliquid', price: hl.ask, bid: hl.bid, ask: hl.ask };
        shortEx = { name: 'Paradex', price: px.bid, bid: px.bid, ask: px.ask };
        isDirect = strategy1Profit > 0;
        spreadPct = (Math.abs(px.bid - hl.ask) / hl.ask) * 100;
        direction = 'LongHL_ShortPx';
      } else {
        profit = strategy2Profit;
        bestStrategy = 'Long Paradex / Short Hyperliquid';
        longEx = { name: 'Paradex', price: px.ask, bid: px.bid, ask: px.ask };
        shortEx = { name: 'Hyperliquid', price: hl.bid, bid: hl.bid, ask: hl.ask };
        isDirect = strategy2Profit > 0;
        spreadPct = (Math.abs(hl.bid - px.ask) / px.ask) * 100;
        direction = 'LongPx_ShortHL';
      }

      opps.push({
        id: idCounter++, // Note: ID might be unstable if list changes order, but token keys are better
        token,
        profit: profit,
        isDirect,
        tradeSize: 0.2,
        spread: spreadPct, // Required for AutoPilot
        exchanges: { long: longEx, short: shortEx },
        strategy: bestStrategy,
        strategyProfit: Math.abs(profit),
        raw: { direction, longPrice: longEx.price, shortPrice: shortEx.price }
      });
    }
    return opps.sort((a, b) => b.profit - a.profit);
  }, [prices]);

  // Paper Trading (Moved after rawOpportunities)
  const {
    activeTrades,
    tradeHistory,
    openTrade,
    closeTrade,
    totalRealizedPnL,
    totalUnrealizedPnL,
    isAutoPilot,
    setIsAutoPilot
  } = usePaperTrading(prices, rawOpportunities);

  // 2. Throttle Updates
  const [throttledOpportunities, setThrottledOpportunities] = useState<any[]>([]);
  const latestRawOppsRef = useRef(rawOpportunities);

  useEffect(() => { latestRawOppsRef.current = rawOpportunities; }, [rawOpportunities]);

  useEffect(() => {
    const val = parseInt(refreshRate);
    const update = () => {
      setThrottledOpportunities(latestRawOppsRef.current);
    };

    if (isNaN(val)) {
      setThrottledOpportunities(rawOpportunities);
      return;
    }

    update();
    const timer = setInterval(update, val);
    return () => clearInterval(timer);
  }, [refreshRate, isNaN(parseInt(refreshRate)) ? rawOpportunities : null]);

  // 3. Filter Instantly
  const displayedOpportunities = useMemo(() => {
    return throttledOpportunities.filter(opp => tokens[opp.token as keyof typeof tokens]);
  }, [throttledOpportunities, tokens]);


  return (
    <div className="p-8 pb-32 pt-16">
      <TickerTape />

      {/* Header */}
      <div className="bg-[#0c1210] border border-[#1a2e26] rounded-xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <RefreshCw className="w-5 h-5 text-gray-400 animate-spin-slow" />
          <h1 className="text-2xl font-bold text-white">Best Arbitrage Opportunities</h1>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm text-gray-500 font-medium">Tokens:</span>
          <div className="flex flex-wrap gap-4 mr-auto">
            {Object.entries(tokens).map(([token, checked]) => (
              <label key={token} className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-green-600 border-green-600' : 'border-gray-600 group-hover:border-gray-500'}`}>
                  {checked && <div className="w-2 h-2 bg-white rounded-[1px]" />}
                </div>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => setTokens(prev => ({ ...prev, [token]: !prev[token as keyof typeof prev] }))}
                  className="hidden"
                />
                <span className={`text-sm font-medium ${checked ? 'text-gray-200' : 'text-gray-500'}`}>{token}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={refreshRate}
              onChange={(e) => setRefreshRate(e.target.value)}
              className="bg-[#1a2e26] border border-[#2a4e40] text-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-green-700"
            >
              <option value="1000">1 sec ⚠️</option>
              <option value="3000">3 sec</option>
              <option value="5000">5 sec</option>
              <option value="10000">10 sec</option>
              <option value="30000">30 sec</option>
            </select>

            <button className="flex items-center gap-2 px-4 py-2 bg-[#1a2e26] border border-[#2a4e40] text-gray-300 rounded-lg text-sm hover:bg-[#2a4e40] transition-colors">
              <span>🚀</span>
              <span>Goofy</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a2e26] border border-[#2a4e40] text-gray-300 rounded-lg text-sm hover:bg-[#2a4e40] transition-colors">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {displayedOpportunities.map(opportunity => (
          <OpportunityCard
            key={opportunity.id}
            {...opportunity}
            onSimulate={() => openTrade(
              opportunity.token,
              opportunity.raw.direction,
              opportunity.raw.longPrice,
              opportunity.raw.shortPrice,
              opportunity.tradeSize
            )}
          />
        ))}
      </div>

      {/* No Data */}
      {displayedOpportunities.length === 0 && (
        <div className="text-center py-20 bg-[#0c1210] border border-[#1a2e26] rounded-xl">
          <p className="text-gray-500">
            Waiting for live price data or markets not connected...
            <br />
            <span className="text-xs text-gray-600 mt-2 block">Connecting to Hyperliquid & Paradex...</span>
          </p>
        </div>
      )}

      {/* Simulator Panel */}
      <PaperTradingPanel
        activeTrades={activeTrades}
        tradeHistory={tradeHistory}
        onCloseTrade={closeTrade}
        totalRealizedPnL={totalRealizedPnL}
        totalUnrealizedPnL={totalUnrealizedPnL}
        isAutoPilot={isAutoPilot}
        setIsAutoPilot={setIsAutoPilot}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(newThresholds) => console.log('Saved:', newThresholds)}
      />
    </div>
  );
}
