
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const endTime = Date.now();
    const startTime = endTime - 60 * 60 * 1000; // Last 1 hour

    try {
        const [hlData, pxData] = await Promise.allSettled([
            fetchHyperliquidHistory(token, startTime, endTime),
            fetchParadexHistory(token, startTime, endTime)
        ]);

        const hlCandles = hlData.status === 'fulfilled' ? hlData.value : [];
        const pxPoints = pxData.status === 'fulfilled' ? pxData.value : [];

        // Map by timestamp (minute precision)
        const pointsMap = new Map<number, { paradex?: number; hyperliquid?: number }>();

        // Process Hyperliquid
        hlCandles.forEach((c: any) => {
            // HL time is already ms
            const t = Math.floor(c.t / 60000) * 60000;
            pointsMap.set(t, { ...pointsMap.get(t), hyperliquid: parseFloat(c.c) });
        });

        // Process Paradex (Already processed into { timestamp, close })
        pxPoints.forEach((p: any) => {
            const t = Math.floor(p.timestamp / 60000) * 60000;
            pointsMap.set(t, { ...pointsMap.get(t), paradex: p.close });
        });

        // Sort and convert to array
        const result = Array.from(pointsMap.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([timestamp, values]) => ({
                time: new Date(timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }),
                timestamp,
                ...values
            }))
            .slice(-60); // Keep last 60 minutes max

        return NextResponse.json(result);

    } catch (err) {
        console.error("Error fetching history:", err);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
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

    // Fetch in 4 chunks of 15 minutes to cover 1 hour with sufficient density
    // v1/trades limit is likely 100 or 1000.
    // For BTC, 15 mins might have > 1000 trades. 
    // We will just ask for "limit=1000" starting at T, T+15m, T+30m, T+45m.
    // Ideally we want the LATEST trades in that window.
    // But `start_at` gives trades AFTER that time.

    const chunkDuration = 15 * 60 * 1000;
    const fetchPromises = [];

    for (let i = 0; i < 4; i++) {
        const chunkStart = start + (i * chunkDuration);
        // We set limit=1000 to catch as much as possible in that chunk.
        // It's possible we only get the *beginning* of the chunk if volume is huge.
        // To get the "close" of minutes correctly, effectively we need samples throughout the hour.
        // Using `start_at` allows us to "seed" the timeline at least.
        const url = `https://api.prod.paradex.trade/v1/trades?market=${symbol}&limit=1000&start_at=${chunkStart}`;
        fetchPromises.push(fetch(url).then(res => res.ok ? res.json() : { results: [] }));
    }

    try {
        const results = await Promise.all(fetchPromises);
        let allTrades: any[] = [];
        results.forEach(r => {
            if (r.results) allTrades = allTrades.concat(r.results);
        });

        // Build 1m candles
        const candlesMap = new Map<number, number>(); // timestamp -> close price

        // Sort trades by time so we process in order
        allTrades.sort((a, b) => a.created_at - b.created_at);

        allTrades.forEach((t: any) => {
            const time = t.created_at;
            const price = parseFloat(t.price);
            const minute = Math.floor(time / 60000) * 60000;

            // Since we sorted ASC, the last one we see for a minute is the close
            candlesMap.set(minute, price);
        });

        return Array.from(candlesMap.entries()).map(([ts, price]) => ({
            timestamp: ts,
            close: price
        }));

    } catch (e) {
        console.error("Paradex history error:", e);
        return [];
    }
}
