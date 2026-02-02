const WebSocket = require('ws');

// Hyperliquid Debug
console.log('--- Connecting to Hyperliquid ---');
const wsHL = new WebSocket('wss://api.hyperliquid.xyz/ws');

wsHL.on('open', () => {
    console.log('HL Connected');
    const msg = {
        method: "subscribe",
        subscription: {
            type: "l2Book",
            coin: "BTC"
        }
    };
    wsHL.send(JSON.stringify(msg));
});

wsHL.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.channel === 'l2Book') {
        console.log('HL Data Sample:');
        console.log(JSON.stringify(msg, null, 2));
        wsHL.close();
    }
});

// Paradex Debug
console.log('--- Connecting to Paradex ---');
const wsPX = new WebSocket('wss://ws.api.prod.paradex.trade/v1');

wsPX.on('open', () => {
    console.log('PX Connected');
    const msg = {
        jsonrpc: "2.0",
        method: "subscribe",
        params: {
            channel: "markets_summary"
        },
        id: 1
    };
    wsPX.send(JSON.stringify(msg));
});

wsPX.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.params && msg.params.channel === 'markets_summary') {
        console.log('PX Data Sample (First item):');
        const d = msg.params.data;
        const item = Array.isArray(d) ? d[0] : d;
        console.log(JSON.stringify(item, null, 2));
        wsPX.close();
    }
});
