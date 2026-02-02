
export interface HistoricalPoint {
    time: string; // HH:MM:SS
    paradex?: number;
    hyperliquid?: number;
    timestamp: number; // Unix timestamp for sorting
}

export async function fetchHistoricalData(token: string): Promise<HistoricalPoint[]> {
    const endTime = Date.now();
    const startTime = endTime - 60 * 60 * 1000; // Last 1 hour

    try {
        const [hlData, pxData] = await Promise.allSettled([
            fetchHyperliquidHistory(token, startTime, endTime),
            fetchParadexHistory(token, startTime, endTime)
        ]);

        const hlCandles = hlData.status === 'fulfilled' ? hlData.value : [];
        const pxCandles = pxData.status === 'fulfilled' ? pxData.value : [];

        // Map by timestamp (minute precision)
        const pointsMap = new Map<number, { paradex?: number; hyperliquid?: number }>();

        // Process Hyperliquid
        hlCandles.forEach((c: any) => {
            // HL time is already ms
            // Round to nearest minute to align
            const t = Math.floor(c.t / 60000) * 60000;
            pointsMap.set(t, { ...pointsMap.get(t), hyperliquid: parseFloat(c.c) }); // c is close price
        });

        // Process Paradex
        pxCandles.forEach((c: any) => {
            // Paradex time usually comes as ms or varies, check doc. Assuming standard OHLCV
            // If endpoint returns 'results', likely array of arrays or objects.
            // Based on typical Paradex API, it returns objects with 'close', 'timestamp'
            const t = Math.floor(c.timestamp / 60000) * 60000;
            pointsMap.set(t, { ...pointsMap.get(t), paradex: parseFloat(c.close) });
        });

        // Sort and convert to array
        return Array.from(pointsMap.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([timestamp, values]) => ({
                time: new Date(timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }), // We only show HH:MM on chart usually, or HH:MM:SS
                timestamp,
                ...values
            }))
            .slice(-60); // Keep last 60 minutes max

    } catch (err) {
        console.error("Error fetching history:", err);
        return [];
    }
}

async function fetchHyperliquidHistory(token: string, start: number, end: number) {
    const response = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: "candleSnapshot",
            req: {
                coin: token,
                interval: "1m",
                startTime: start,
                endTime: end
            }
        })
    });
    if (!response.ok) throw new Error('HL fetch failed');
    const data = await response.json();
    return data;
}

async function fetchParadexHistory(token: string, start: number, end: number) {
    // Paradex symbol mapping
    const symbolMap: Record<string, string> = {
        'BTC': 'BTC-USD-PERP',
        'ETH': 'ETH-USD-PERP',
        'SOL': 'SOL-USD-PERP',
        'AVAX': 'AVAX-USD-PERP',
        'HYPE': 'HYPE-USD-PERP'
    };

    const symbol = symbolMap[token] || `${token}-USD-PERP`;

    // Fallback: v1/trades (Public)
    // Since official candles endpoint is private, we fetch recent trades and build candles manually.
    // We try to fetch enough trades to cover some history. 
    // Max limit is usually 100 or 1000. Let's try 1000.
    const url = `https://api.prod.paradex.trade/v1/trades?market=${symbol}&limit=1000`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`Paradex trades fetch failed: ${response.status}`);
            return [];
        }

        const data = await response.json();
        const trades = data.results || [];

        // Build 1m candles from trades
        const candlesMap = new Map<number, number>(); // timestamp -> close price

        // Trades are usually desc or asc. We need to handle them.
        // API documentation often says newest first.
        // We iterate and bucket by minute.

        trades.forEach((t: any) => {
            const time = t.created_at;
            const price = parseFloat(t.price);

            // Round to minute
            const minute = Math.floor(time / 60000) * 60000;

            // Should we take the last trade of the minute?
            // If the map doesn't have this minute, or if this trade is LATER than what we have?
            // If trades are Descending (newest first), the FIRST trade we see for a minute is the CLOSE.
            // If trades are Ascending, the LAST trade we see is the CLOSE.

            // Looking at curl output: times decreased (1769...05 -> 1769...03). So it's DESCENDING.
            // So the first trade we encounter for a minute is the latest (Close).
            if (!candlesMap.has(minute)) {
                candlesMap.set(minute, price);
            }
        });

        // Convert map to array format expected by the aligner
        // The aligner expects objects with 'timestamp' or similar? 
        // No, the caller expects an array of objects that *this function* usually normalized?
        // Wait, the caller (process Paradex) expects: { close: number, timestamp: number } (like default API)

        // Let's create compatible objects
        const results = Array.from(candlesMap.entries()).map(([ts, price]) => ({
            timestamp: ts,
            close: price
        }));

        return results;

    } catch (e) {
        console.error("Paradex history error:", e);
        return [];
    }
}
