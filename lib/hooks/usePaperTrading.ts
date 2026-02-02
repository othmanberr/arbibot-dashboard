import { useState, useCallback, useEffect } from 'react';
import { TokenPrices } from './useCryptoPrices';

export interface Trade {
    id: string;
    token: string;
    entryTime: number;
    direction: 'LongHL_ShortPx' | 'LongPx_ShortHL';
    entryLongPrice: number;
    entryShortPrice: number;
    entrySpread: number;
    size: number;
    // Computed / Dynamic State
    currentPnL?: number;
    maxPnL?: number;        // Highest PnL reached
    maxPnLTime?: number;    // When that High was reached
    status: 'OPEN' | 'CLOSED';
    exitTime?: number;
    exitPnL?: number;
}

export function usePaperTrading(currentPrices: TokenPrices, opportunities: any[] = []) {
    const [activeTrades, setActiveTrades] = useState<Trade[]>([]);
    const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);

    // Monitor Prices and Update Max PnL
    useEffect(() => {
        setActiveTrades(prevTrades => {
            let hasUpdates = false;
            const updatedTrades = prevTrades.map(trade => {
                const prices = currentPrices[trade.token];
                if (!prices || !prices.Hyperliquid || !prices.Paradex) return trade;

                let currentLongExit = 0;
                let currentShortExit = 0;

                if (trade.direction === 'LongHL_ShortPx') {
                    // To close: Sell HL (Bid), Buy Px (Ask)
                    currentLongExit = prices.Hyperliquid.bid;
                    currentShortExit = prices.Paradex.ask;
                } else {
                    // To close: Sell Px (Bid), Buy HL (Ask)
                    currentLongExit = prices.Paradex.bid;
                    currentShortExit = prices.Hyperliquid.ask;
                }

                // Current PnL
                const longPnL = (currentLongExit - trade.entryLongPrice) * trade.size;
                const shortPnL = (trade.entryShortPrice - currentShortExit) * trade.size;
                const currentPnL = longPnL + shortPnL;

                // Check for Max PnL record
                const prevMax = trade.maxPnL || -Infinity;

                if (currentPnL > prevMax) {
                    hasUpdates = true;
                    return {
                        ...trade,
                        currentPnL,
                        maxPnL: currentPnL,
                        maxPnLTime: Date.now()
                    };
                }

                // Update current PnL for display
                if (currentPnL !== trade.currentPnL) {
                    hasUpdates = true;
                    return { ...trade, currentPnL };
                }

                return trade;
            });

            return hasUpdates ? updatedTrades : prevTrades;
        });
    }, [currentPrices]);


    // AUTO-PILOT LOGIC
    const [isAutoPilot, setIsAutoPilot] = useState(false);

    // Load AutoPilot state from storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('arbibot_autopilot');
        if (saved) setIsAutoPilot(JSON.parse(saved));
    }, []);

    // Save AutoPilot state when changed
    useEffect(() => {
        localStorage.setItem('arbibot_autopilot', JSON.stringify(isAutoPilot));
    }, [isAutoPilot]);

    // Auto-Pilot Execution Logic
    useEffect(() => {
        if (!isAutoPilot) return;

        // 1. Check for Exits (Convergence < 0.1%)
        activeTrades.forEach(trade => {
            const prices = currentPrices[trade.token];
            if (!prices || !prices.Hyperliquid || !prices.Paradex) return;

            const hlMid = (prices.Hyperliquid.bid + prices.Hyperliquid.ask) / 2;
            const pxMid = (prices.Paradex.bid + prices.Paradex.ask) / 2;
            const spread = Math.abs((pxMid - hlMid) / hlMid) * 100;

            if (spread < 0.01) {
                closeTrade(trade.id);
            }
        });

        // 2. Check for Entries (Spread > 0.08%)
        if (opportunities) {
            opportunities.forEach(opp => {
                if (activeTrades.find(t => t.token === opp.token)) return; // Already open

                // Entry threshold > Exit threshold (0.08% vs 0.01%)
                if (Math.abs(opp.spread) > 0.08) {
                    const direction = opp.spread > 0 ? 'LongHL_ShortPx' : 'LongPx_ShortHL';
                    // Look up prices
                    const p = currentPrices[opp.token];
                    if (p && p.Hyperliquid && p.Paradex) {
                        let longP = 0; let shortP = 0;
                        if (direction === 'LongHL_ShortPx') {
                            longP = p.Hyperliquid.ask;
                            shortP = p.Paradex.bid;
                        } else {
                            longP = p.Paradex.ask;
                            shortP = p.Hyperliquid.bid;
                        }
                        if (longP && shortP)
                            openTrade(opp.token, direction, longP, shortP, 100 / longP);
                    }
                }
            });
        }

    }, [isAutoPilot, currentPrices, opportunities, activeTrades]);


    // Open a new trade
    const openTrade = useCallback((
        token: string,
        direction: 'LongHL_ShortPx' | 'LongPx_ShortHL',
        longPrice: number,
        shortPrice: number,
        size: number
    ) => {
        const newTrade: Trade = {
            id: Date.now().toString(),
            token,
            entryTime: Date.now(),
            direction,
            entryLongPrice: longPrice,
            entryShortPrice: shortPrice,
            entrySpread: Math.abs(shortPrice - longPrice),
            size,
            status: 'OPEN',
            currentPnL: 0,
            maxPnL: 0,
            maxPnLTime: Date.now()
        };
        setActiveTrades(prev => [newTrade, ...prev]);
    }, []);

    // Close a trade
    const closeTrade = useCallback((tradeId: string) => {
        setActiveTrades(prev => {
            const trade = prev.find(t => t.id === tradeId);
            if (!trade) return prev;

            // Use the stored currentPnL which is kept fresh by the effect
            const prices = currentPrices[trade.token];
            let finalPnL = trade.currentPnL || 0;

            // Safety recalculation
            if (prices && prices.Hyperliquid && prices.Paradex) {
                let exitLongPrice = 0;
                let exitShortPrice = 0;
                if (trade.direction === 'LongHL_ShortPx') {
                    exitLongPrice = prices.Hyperliquid.bid;
                    exitShortPrice = prices.Paradex.ask;
                } else {
                    exitLongPrice = prices.Paradex.bid;
                    exitShortPrice = prices.Hyperliquid.ask;
                }
                finalPnL = ((exitLongPrice - trade.entryLongPrice) * trade.size) +
                    ((trade.entryShortPrice - exitShortPrice) * trade.size);
            }

            const closedTrade: Trade = {
                ...trade,
                status: 'CLOSED',
                exitTime: Date.now(),
                exitPnL: finalPnL
            };

            setTradeHistory(history => [closedTrade, ...history]);
            return prev.filter(t => t.id !== tradeId);
        });
    }, [currentPrices]);

    // Return values
    // Note: activeTrades state is already updated with PnLs by useEffect
    const totalRealizedPnL = tradeHistory.reduce((acc, t) => acc + (t.exitPnL || 0), 0);
    const totalUnrealizedPnL = activeTrades.reduce((acc, t) => acc + (t.currentPnL || 0), 0);

    return {
        activeTrades,
        tradeHistory,
        openTrade,
        closeTrade,
        totalRealizedPnL,
        totalUnrealizedPnL,
        isAutoPilot,
        setIsAutoPilot
    };
}
