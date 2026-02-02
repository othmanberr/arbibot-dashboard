import { useState, useEffect, useRef, useCallback } from 'react';

export interface PriceData {
    bid: number;
    ask: number;
    last: number;
}

export type ExchangeName = 'Hyperliquid' | 'Paradex';

export interface TokenPrices {
    [token: string]: {
        [exchange in ExchangeName]?: PriceData;
    };
}

const PARADEX_MAP: Record<string, string> = {
    'BTC': 'BTC-USD-PERP',
    'ETH': 'ETH-USD-PERP',
    'BNB': 'BNB-USD-PERP',
    'SOL': 'SOL-USD-PERP',
    'AVAX': 'AVAX-USD-PERP',
    'HYPE': 'HYPE-USD-PERP', // Assuming availability, will fail silently if not
    'ASTER': 'ASTER-USD-PERP',
    'MATIC': 'MATIC-USD-PERP',
    'PAXG': 'PAXG-USD-PERP'
};

const HYPERLIQUID_TOKENS = ['BTC', 'ETH', 'BNB', 'SOL', 'HYPE', 'PURR', 'AVAX', 'MATIC', 'PAXG'];

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export function useCryptoPrices() {
    const [prices, setPrices] = useState<TokenPrices>({});
    const [status, setStatus] = useState<{
        hyperliquid: ConnectionStatus;
        paradex: ConnectionStatus;
    }>({
        hyperliquid: 'disconnected',
        paradex: 'disconnected'
    });

    const updatePrice = useCallback((token: string, exchange: ExchangeName, data: PriceData) => {
        setPrices(prev => ({
            ...prev,
            [token]: {
                ...prev[token],
                [exchange]: data
            }
        }));
    }, []);

    // Hyperliquid WebSocket
    useEffect(() => {
        let ws: WebSocket | null = null;
        let keepAliveInterval: NodeJS.Timeout;

        const connect = () => {
            setStatus(prev => ({ ...prev, hyperliquid: 'connecting' }));
            try {
                ws = new WebSocket('wss://api.hyperliquid.xyz/ws');

                ws.onopen = () => {
                    console.log('Hyperliquid WS Connected');
                    setStatus(prev => ({ ...prev, hyperliquid: 'connected' }));

                    const subscribeMsg = {
                        method: "subscribe",
                        subscription: {
                            type: "l2Book",
                            coin: "BTC"
                        }
                    };
                    HYPERLIQUID_TOKENS.forEach(coin => {
                        if (ws && ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({
                                method: "subscribe",
                                subscription: {
                                    type: "l2Book",
                                    coin: coin
                                }
                            }));
                        }
                    });
                };

                ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        if (message.channel === 'l2Book') {
                            const coin = message.data.coin;
                            const bids = message.data.levels[0];
                            const asks = message.data.levels[1];

                            if (bids && bids.length > 0 && asks && asks.length > 0) {
                                // Hyperliquid L2 structure confirmed as array of objects {px, sz, n}
                                const bestBid = bids[0];
                                const bestAsk = asks[0];
                                const bidPx = parseFloat(bestBid.px || bestBid[0]);
                                const askPx = parseFloat(bestAsk.px || bestAsk[0]);

                                updatePrice(coin, 'Hyperliquid', {
                                    bid: bidPx,
                                    ask: askPx,
                                    last: (bidPx + askPx) / 2
                                });
                            }
                        }
                    } catch (e) {
                        console.error('Hyperliquid Parse Error:', e);
                    }
                };

                ws.onerror = (e) => {
                    console.error('Hyperliquid WS Error:', e);
                    setStatus(prev => ({ ...prev, hyperliquid: 'error' }));
                };

                ws.onclose = () => {
                    console.log('Hyperliquid WS Closed');
                    setStatus(prev => ({ ...prev, hyperliquid: 'disconnected' }));
                    setTimeout(connect, 5000);
                };
            } catch (e) {
                console.error('Hyperliquid Setup Error:', e);
            }
        };

        connect();

        return () => {
            if (ws) ws.close();
            // clearInterval(keepAliveInterval); // Not using manual ping anymore
        };
    }, [updatePrice]);

    // Paradex WebSocket
    useEffect(() => {
        let ws: WebSocket | null = null;

        const connect = () => {
            setStatus(prev => ({ ...prev, paradex: 'connecting' }));
            try {
                ws = new WebSocket('wss://ws.api.prod.paradex.trade/v1');

                ws.onopen = () => {
                    console.log('Paradex WS Connected');
                    setStatus(prev => ({ ...prev, paradex: 'connected' }));

                    // Subscribe to global markets_summary for robust price feed
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({
                            jsonrpc: "2.0",
                            method: "subscribe",
                            params: {
                                channel: "markets_summary"
                            },
                            id: 1
                        }));
                    }
                };

                ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);

                        // Handle markets_summary
                        if (message.params && message.params.channel === 'markets_summary') {
                            const data = message.params.data;
                            const items = Array.isArray(data) ? data : [data];

                            items.forEach((item: any) => {
                                const market = item.symbol;
                                const token = Object.keys(PARADEX_MAP).find(key => PARADEX_MAP[key] === market);

                                if (token) {
                                    // Debug confirmed fields: bid, ask, last_traded_price
                                    const px = parseFloat(item.last_traded_price || item.last_price || "0");
                                    const bestBid = parseFloat(item.bid || item.best_bid || item.last_traded_price || "0");
                                    const bestAsk = parseFloat(item.ask || item.best_ask || item.last_traded_price || "0");

                                    if (px > 0) {
                                        updatePrice(token, 'Paradex', {
                                            bid: bestBid,
                                            ask: bestAsk,
                                            last: px
                                        });
                                    }
                                }
                            });
                        }
                    } catch (e) {
                        console.error('Paradex Parse Error:', e);
                    }
                };

                ws.onerror = (e) => {
                    console.error('Paradex WS Error:', e);
                    setStatus(prev => ({ ...prev, paradex: 'error' }));
                };

                ws.onclose = () => {
                    console.log('Paradex WS Closed');
                    setStatus(prev => ({ ...prev, paradex: 'disconnected' }));
                    setTimeout(connect, 5000);
                };
            } catch (e) {
                console.error('Paradex Setup Error:', e);
            }
        };

        connect();

        return () => {
            if (ws) ws.close();
        };
    }, [updatePrice]);

    return { prices, status };
}
