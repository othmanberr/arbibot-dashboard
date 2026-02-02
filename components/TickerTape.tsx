'use client';

import { useCryptoPrices } from '@/lib/hooks/useCryptoPrices';
import { useMemo } from 'react';

export default function TickerTape() {
    const { prices } = useCryptoPrices();

    // Convert prices object to a flat list of spreads for the ticker
    const tickerItems = useMemo(() => {
        return Object.entries(prices).map(([token, data]) => {
            if (!data.Hyperliquid || !data.Paradex) return null;

            const hlPrice = (data.Hyperliquid.bid + data.Hyperliquid.ask) / 2;
            const pxPrice = (data.Paradex.bid + data.Paradex.ask) / 2;
            const spread = Math.abs(hlPrice - pxPrice);
            const spreadPct = (spread / hlPrice) * 100;

            return {
                token,
                price: hlPrice,
                spreadPct,
                isHot: spreadPct > 0.1
            };
        }).filter(Boolean);
    }, [prices]);

    if (tickerItems.length === 0) return null;

    return (
        <div className="w-full bg-[#050a08] border-b border-[#1a2e26] overflow-hidden py-2 fixed top-0 z-50 backdrop-blur-md bg-opacity-90">
            <div className="animate-marquee whitespace-nowrap flex gap-8 items-center">
                {/* Duplicate list 3 times to ensure smooth infinite scroll */}
                {[...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-mono">
                        <span className="font-bold text-gray-400">{item!.token}</span>
                        <span className="text-gray-600">${item!.price.toFixed(2)}</span>
                        <span className={`px-1.5 py-0.5 rounded ${item!.isHot ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                            spread: {item!.spreadPct.toFixed(3)}%
                        </span>
                        {item!.isHot && <span className="text-[10px] animate-pulse">🔥</span>}
                        <span className="text-gray-800">|</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
