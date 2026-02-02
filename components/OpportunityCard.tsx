'use client';

import { TrendingUp, TrendingDown, Target, Activity, Rocket } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

interface OpportunityCardProps {
  id: number;
  token: string;
  profit: number;
  isDirect: boolean;
  tradeSize: number;
  exchanges: {
    long: {
      name: string;
      price: number;
      bid: number;
      ask: number;
    };
    short: {
      name: string;
      price: number;
      bid: number;
      ask: number;
    };
  };
  strategy: string;
  strategyProfit: number;
  onSimulate?: () => void; // Optional callback
}

function FlashingPrice({ price }: { price: number }) {
  const [color, setColor] = useState('text-white');
  const prevPrice = useRef(price);

  useEffect(() => {
    if (price > prevPrice.current) {
      setColor('text-green-500 transition-colors duration-300');
      setTimeout(() => setColor('text-white transition-colors duration-1000'), 300);
    } else if (price < prevPrice.current) {
      setColor('text-red-500 transition-colors duration-300');
      setTimeout(() => setColor('text-white transition-colors duration-1000'), 300);
    }
    prevPrice.current = price;
  }, [price]);

  return <span className={`text-3xl font-bold tracking-tight ${color}`}>${price.toFixed(price < 1 ? 4 : 2)}</span>;
}

export default function OpportunityCard({
  id,
  token,
  profit,
  isDirect,
  tradeSize,
  exchanges,
  strategy,
  strategyProfit,
  onSimulate
}: OpportunityCardProps) {

  // Calculate spreads
  const calculatedSpread = Math.abs(exchanges.short.bid - exchanges.long.ask); // Renamed to force update
  const spreadPct = (calculatedSpread / exchanges.long.ask) * 100;

  // Calculate specific direction PnLs for display
  const shortLongPnL = exchanges.short.bid - exchanges.long.ask; // Short A - Long B
  const longShortPnL = exchanges.long.bid - exchanges.short.ask; // Short B - Long A

  // Holographic Effect State
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateXValue = ((y - centerY) / centerY) * -10; // Max 10 deg tilt
    const rotateYValue = ((x - centerX) / centerX) * 10;

    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
    setGlarePosition({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePosition({ x: 50, y: 50 }); // Center glare
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1, 1, 1)`,
        transition: 'transform 0.1s ease-out'
      }}
      className={`rounded-2xl border p-6 shadow-2xl relative overflow-hidden group hover:z-50 ${isDirect
        ? 'bg-gradient-to-br from-gray-900 via-[#050a08] to-gray-900 border-green-500/50 shadow-green-900/20'
        : 'bg-[#0a0a0a] border-gray-800'
        }`}>

      {/* 3D Glare Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-40 transition-opacity duration-300 z-20 mix-blend-overlay"
        style={{
          background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 80%)`
        }}
      />

      {/* Live Scanning Effect */}
      {isDirect && (
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-green-400 to-transparent animate-scan opacity-70" />
      )}

      {/* Background glow effect for direct arb */}
      {isDirect && (
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -translate-y-32 translate-x-32 pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10" style={{ transform: 'translateZ(20px)' }}>
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded bg-[#1a2e26] text-gray-400 text-sm font-mono border border-[#2a4e40]">
            #{id}
          </span>
          <h3 className="text-3xl font-bold text-gray-100">{token}</h3>

          {isDirect && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold tracking-wider uppercase rounded-full border border-green-500/30">
              <span className="text-lg">🔥</span>
              ARBITRAGE DIRECT
            </span>
          )}
        </div>

        {/* SIMULATE BUTTON */}
        {onSimulate && (
          <button
            onClick={onSimulate}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-lg hover:bg-purple-600/40 transition-colors text-xs font-bold uppercase tracking-wide cursor-pointer active:scale-95"
          >
            <Rocket className="w-3 h-3" />
            Simuler
          </button>
        )}
      </div>

      {/* Trade Size Input */}
      <div className="mb-6 relative z-10" style={{ transform: 'translateZ(10px)' }}>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider pl-1">
            Trade size ({token}):
          </label>
          <div className="bg-[#1a1a1a] rounded px-2 py-1 border border-gray-800">
            <span className="text-xs text-gray-400">{tradeSize}</span>
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6 relative z-10" style={{ transform: 'translateZ(30px)' }}>
        {/* Long Card - Clearly GREEN */}
        <div className="bg-green-500/10 border border-green-500/40 rounded-xl p-4 relative shadow-[0_0_20px_rgba(34,197,94,0.1)] backdrop-blur-sm transition-colors hover:bg-green-500/15">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-300 font-bold tracking-wide">{exchanges.long.name}</span>
            <span className="flex items-center gap-1 text-[10px] font-black text-white bg-green-600 px-2 py-1 rounded shadow-lg shadow-green-600/20">
              <TrendingUp className="w-3 h-3" /> LONG
            </span>
          </div>
          <div className="mb-3">
            <FlashingPrice price={exchanges.long.price} />
          </div>
          <div className="space-y-1.5 pt-3 border-t border-green-500/20">
            <div className="flex justify-between items-center text-xs">
              <span className="text-green-300/70">Bid:</span>
              <span className="text-green-100 font-mono">${exchanges.long.bid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-green-300/70">Ask:</span>
              <span className="text-white font-mono font-bold text-shadow-sm">${exchanges.long.ask.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Short Card - Clearly RED */}
        <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 relative shadow-[0_0_20px_rgba(239,68,68,0.1)] backdrop-blur-sm transition-colors hover:bg-red-500/15">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-300 font-bold tracking-wide">{exchanges.short.name}</span>
            <span className="flex items-center gap-1 text-[10px] font-black text-white bg-red-600 px-2 py-1 rounded shadow-lg shadow-red-600/20">
              <TrendingDown className="w-3 h-3" /> SHORT
            </span>
          </div>
          <div className="mb-3">
            <FlashingPrice price={exchanges.short.price} />
          </div>
          <div className="space-y-1.5 pt-3 border-t border-red-500/20">
            <div className="flex justify-between items-center text-xs">
              <span className="text-red-300/70">Bid:</span>
              <span className="text-white font-mono font-bold text-shadow-sm">${exchanges.short.bid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-red-300/70">Ask:</span>
              <span className="text-red-100 font-mono">${exchanges.short.ask.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Analysis */}
      <div className="bg-[#0a0f0d] rounded-lg border border-[#1a2e26] p-4 relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-green-500" />
          <h4 className="text-green-500 font-bold text-sm">Opportunités d'Arbitrage Direct</h4>
        </div>

        {/* Highlight Box */}
        {isDirect && (
          <div className="bg-[#0f1a16] border border-green-900/20 rounded p-3 mb-4 flex flex-wrap items-center gap-2">
            <span className="bg-green-700 text-white text-[10px] font-bold px-2 py-1 rounded">SHORT {exchanges.short.name.toUpperCase()}</span>
            <span className="text-gray-300 text-xs truncate max-w-[200px]">
              Bid {exchanges.short.name} &gt; Ask {exchanges.long.name}
            </span>
            <span className="ml-auto text-green-400 font-mono font-bold text-lg">${calculatedSpread.toFixed(2)}</span>
          </div>
        )}

        {/* Effective Prices Breakdown */}
        <div className="space-y-3">
          <p className="text-xs text-gray-500 font-semibold mb-2">Prix effectifs pour {tradeSize} {token} (VWAP carnet)</p>

          {/* Calculation Row 1: Short ShortEx - Long LongEx */}
          <div className="flex justify-between items-center text-xs border-b border-[#1a2e26] pb-2">
            <div className="text-gray-400 flex flex-col">
              <span>Short {exchanges.short.name} • Long {exchanges.long.name}</span>
              <span className="text-[10px] text-gray-600">${exchanges.short.bid.toFixed(2)} - ${exchanges.long.ask.toFixed(2)}</span>
            </div>
            <div className={`font-mono ${shortLongPnL > 0 ? "text-green-500" : "text-gray-500"}`}>
              {shortLongPnL > 0 ? "+" : ""}${shortLongPnL.toFixed(4)}
            </div>
          </div>

          {/* Calculation Row 2: Short LongEx - Long ShortEx (The reverse, usually negative) */}
          <div className="flex justify-between items-center text-xs border-b border-[#1a2e26] pb-2">
            <div className="text-gray-400 flex flex-col">
              <span>Short {exchanges.long.name} • Long {exchanges.short.name}</span>
              <span className="text-[10px] text-gray-600">${exchanges.long.bid.toFixed(2)} - ${exchanges.short.ask.toFixed(2)}</span>
            </div>
            <div className={`font-mono ${longShortPnL > 0 ? "text-green-500" : "text-gray-500"}`}>
              {longShortPnL > 0 ? "+" : ""}${longShortPnL.toFixed(4)}
            </div>
          </div>

          {/* Stats Rows */}
          <div className="pt-2 flex justify-between items-center">
            <span className="text-gray-500 text-xs">Spread Moyen</span>
            <span className="text-lg font-bold text-gray-300 font-mono">${calculatedSpread.toFixed(4)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-xs">Seuil Recommandé</span>
            <span className="text-gray-500 text-xs font-mono">$0.0200</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Spread %</span>
            <span className="text-white font-bold text-sm font-mono">{spreadPct.toFixed(4)}%</span>
          </div>

          {/* Huge CTA Button */}
          {isDirect && (
            <div className="mt-4 bg-green-600 rounded-lg p-3 text-center cursor-pointer hover:bg-green-500 transition-colors shadow-lg shadow-green-900/20 group">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Rocket className="w-5 h-5 text-white animate-pulse" />
                <span className="text-white font-black italic uppercase tracking-wider">ARBITRAGE DIRECT DÉTECTÉ</span>
                <Rocket className="w-5 h-5 text-white animate-pulse" />
              </div>
              <p className="text-green-100 text-[10px]">
                {exchanges.short.name} Bid ${exchanges.short.bid.toFixed(2)} &gt; {exchanges.long.name} Ask ${exchanges.long.ask.toFixed(2)}
                <br />
                <span className="font-bold underline">Profit estimé: ${profit.toFixed(3)}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
