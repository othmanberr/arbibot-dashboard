import { useState, useEffect, useCallback } from 'react';

export interface MarketData {
    symbol: string;
    fundingRate: number; // 1h funding rate
    openInterest: number; // in USD
    oraclePx: number;
}

export interface ExchangeMarketData {
    [symbol: string]: {
        [exchange: string]: MarketData;
    }
}

const PARADEX_MAP: Record<string, string> = {
    'BTC': 'BTC-USD-PERP',
    'ETH': 'ETH-USD-PERP',
    'BNB': 'BNB-USD-PERP',
    'SOL': 'SOL-USD-PERP',
    'AVAX': 'AVAX-USD-PERP',
    'HYPE': 'HYPE-USD-PERP',
    'ASTER': 'ASTER-USD-PERP',
    'MATIC': 'MATIC-USD-PERP',
    'PAXG': 'PAXG-USD-PERP' // Gold
};

const HYPERLIQUID_TOKENS = ['BTC', 'ETH', 'BNB', 'SOL', 'HYPE', 'AVAX', 'MATIC', 'PAXG'];

export function useMarketData() {
    const [data, setData] = useState<ExchangeMarketData>({});

    const updateData = useCallback((symbol: string, exchange: string, newData: Partial<MarketData>) => {
        setData(prev => {
            const currentSymbolData = prev[symbol] || {};
            const currentExchangeData = currentSymbolData[exchange] || { symbol, fundingRate: 0, openInterest: 0, oraclePx: 0 };

            return {
                ...prev,
                [symbol]: {
                    ...currentSymbolData,
                    [exchange]: { ...currentExchangeData, ...newData }
                }
            };
        });
    }, []);

    // Hyperliquid: Poll metaAndAssetCtxs (REST) for OI and Funding
    // This is the most reliable way to get all tickers at once.
    useEffect(() => {
        const fetchHyperliquid = async () => {
            try {
                const res = await fetch('https://api.hyperliquid.xyz/info', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: "metaAndAssetCtxs" })
                });
                const json = await res.json();
                // json[0] is universe (metadata), json[1] is assetCtxs
                // json[0] is metadata object containing universe, json[1] is assetCtxs
                const universe = json[0].universe;
                const assetCtxs = json[1];

                universe.forEach((u: any, index: number) => {
                    const symbol = u.name;
                    const ctx = assetCtxs[index];
                    if (ctx && HYPERLIQUID_TOKENS.includes(symbol)) {
                        // Deployment State (ctx)
                        // funding: hourly funding rate
                        // openInterest: OI in base currency usually? Or quote?
                        // Hyperliquid openInterest is in units of the asset (Coins)
                        // need to multiply by oraclePx to get USD.

                        const oraclePx = parseFloat(ctx.oraclePx);
                        const oiCoins = parseFloat(ctx.openInterest);
                        const oiUsd = oiCoins * oraclePx;
                        const funding = parseFloat(ctx.funding); // This is hourly funding rate? Or usually funding rate per hour.

                        updateData(symbol, 'Hyperliquid', {
                            // Hyperliquid funding is "premium per hour" fraction
                            // We convert to APR: funding * 24 * 365 * 100
                            fundingRate: funding * 24 * 365 * 100,
                            openInterest: oiUsd,
                            oraclePx: oraclePx
                        });
                    }
                });
            } catch (e) {
                console.error("HL Fetch Error", e);
            }
        };

        fetchHyperliquid();
        const interval = setInterval(fetchHyperliquid, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [updateData]);

    // Paradex WebSocket for Data
    useEffect(() => {
        let ws: WebSocket | null = null;

        const connect = () => {
            ws = new WebSocket('wss://ws.api.prod.paradex.trade/v1');

            ws.onopen = () => {
                // Subscribe to markets_summary for 24h stats (OI, etc)
                // Subscribe to funding_data for funding rates
                Object.entries(PARADEX_MAP).forEach(([symbol, market]) => {
                    // Markets Summary
                    ws?.send(JSON.stringify({
                        jsonrpc: "2.0",
                        method: "subscribe",
                        params: { channel: "markets_summary" }, // this is global usually? Or per market?
                        // Paradex docs: channel "markets_summary" (no market param) for all? Or "markets_summary.{market}"?
                        // Usually returns all.
                        id: 1
                    }));

                    // Funding Data - Docs say "funding_data.{symbol}" is not standard?
                    // Paradox usually publishes funding via headers or specific channel.
                    // Let's try 'markets_summary' first, it often contains current_funding_rate or similar.
                });
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);

                    // Handle markets_summary
                    if (message.params && message.params.channel === 'markets_summary') {
                        // data is usually an array of markets or a single update
                        const data = message.params.data;
                        // If it's an array:
                        /* 
                          {
                            symbol: "BTC-USD-PERP",
                            open_interest: "10.5",
                            funding_rate: "0.00002",
                            last_price: ...
                          }
                        */
                        // Paradex structure might vary, let's assume it pushes updates.
                        // Check if data is array or object.
                        const items = Array.isArray(data) ? data : [data];

                        items.forEach((item: any) => {
                            const market = item.symbol;
                            const token = Object.keys(PARADEX_MAP).find(key => PARADEX_MAP[key] === market);

                            if (token) {
                                const funding = parseFloat(item.funding_rate || "0");
                                const oi = parseFloat(item.open_interest || "0");
                                const px = parseFloat(item.last_price || "0");
                                const oiUsd = oi * px; // OI is usually in base currency

                                updateData(token, 'Paradex', {
                                    fundingRate: funding * 24 * 365 * 100, // APR assumption
                                    openInterest: oiUsd,
                                    oraclePx: px
                                });
                            }
                        });
                    }
                } catch (e) {
                    // ignore
                }
            };

            ws.onclose = () => {
                setTimeout(connect, 5000);
            };
        };

        connect();

        return () => {
            if (ws) ws.close();
        };
    }, [updateData]);

    return data;
}
