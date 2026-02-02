// Données mockées pour l'application

// Génère des données de prix pour un graphique
export function generatePriceData(basePrice: number, count: number = 50) {
  const data = [];
  let currentPrice = basePrice;
  const now = Date.now();

  for (let i = count; i >= 0; i--) {
    const timestamp = new Date(now - i * 3 * 60 * 1000); // 3 minutes d'intervalle
    const variation = (Math.random() - 0.5) * 100;
    currentPrice += variation;

    data.push({
      time: timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      timestamp: timestamp.getTime(),
      paradex: currentPrice + Math.random() * 50 - 25,
      hyperliquid: currentPrice + Math.random() * 60 - 30,
      lighter: currentPrice + Math.random() * 40 - 20,
    });
  }

  return data;
}

// Opportunités d'arbitrage
export const arbitrageOpportunities = [
  {
    id: 1,
    token: 'BTC',
    profit: 62.050,
    isDirect: true,
    tradeSize: 0.2,
    exchanges: {
      long: {
        name: 'Paradex',
        price: 78535.40,
        bid: 78535.30,
        ask: 78535.50,
      },
      short: {
        name: 'Lighter',
        price: 78597.45,
        bid: 78597.40,
        ask: 78597.50,
      }
    },
    strategy: 'SHORT LIGHTER + Bid Lighter > Ask Paradex',
    strategyProfit: 61.900
  },
  {
    id: 2,
    token: 'ETH',
    profit: 1.8400,
    isDirect: false,
    tradeSize: 0.2,
    exchanges: {
      long: {
        name: 'Paradex',
        price: 2396.24,
        bid: 2396.23,
        ask: 2396.26,
      },
      short: {
        name: 'Lighter',
        price: 2398.09,
        bid: 2398.06,
        ask: 2398.11,
      }
    },
    strategy: 'Short Paradex • Long Lighter',
    strategyProfit: 1.8400
  },
  {
    id: 3,
    token: 'SOL',
    profit: 0.3200,
    isDirect: false,
    tradeSize: 1.0,
    exchanges: {
      long: {
        name: 'Hyperliquid',
        price: 98.45,
        bid: 98.44,
        ask: 98.47,
      },
      short: {
        name: 'Paradex',
        price: 98.78,
        bid: 98.77,
        ask: 98.79,
      }
    },
    strategy: 'Short Paradex • Long Hyperliquid',
    strategyProfit: 0.3200
  }
];

// Fundings Rate data
export const fundingRates = [
  {
    id: 1,
    pair: 'SKR',
    strategy: 'Short paradex • Long lighter',
    apr: 146.9,
    price: 0.01692507,
    openInterest: 3100,
    paradex: -7942.2,
    lighter: 8089.1,
    exchanges: ['Paradex', 'Lighter']
  },
  {
    id: 2,
    pair: 'BCH',
    strategy: 'Short paradex • Long lighter',
    apr: 117.3,
    price: 533.9251055,
    openInterest: 1800000,
    paradex: -58.1,
    lighter: 58.8,
    exchanges: ['Paradex', 'Lighter']
  },
  {
    id: 3,
    pair: 'APEX',
    strategy: 'Short paradex • Long lighter',
    apr: 117.2,
    price: 0.92,
    openInterest: 10500,
    paradex: -58.0,
    lighter: 58.7,
    exchanges: ['Paradex', 'Lighter']
  },
  {
    id: 4,
    pair: 'DOGE',
    strategy: 'Long paradex • Short hyperliquid',
    apr: 89.5,
    price: 0.1234,
    openInterest: 5600000,
    paradex: 44.2,
    lighter: -43.8,
    exchanges: ['Paradex', 'Hyperliquid']
  },
  {
    id: 5,
    pair: 'MATIC',
    strategy: 'Short lighter • Long paradex',
    apr: 76.8,
    price: 0.8901,
    openInterest: 2300000,
    paradex: 38.1,
    lighter: -37.9,
    exchanges: ['Lighter', 'Paradex']
  },
  {
    id: 6,
    pair: 'AVAX',
    strategy: 'Long hyperliquid • Short paradex',
    apr: 65.4,
    price: 28.45,
    openInterest: 890000,
    paradex: -32.4,
    lighter: 32.8,
    exchanges: ['Hyperliquid', 'Paradex']
  },
  {
    id: 7,
    pair: 'LINK',
    strategy: 'Short paradex • Long lighter',
    apr: 54.2,
    price: 14.56,
    openInterest: 1200000,
    paradex: -26.9,
    lighter: 27.1,
    exchanges: ['Paradex', 'Lighter']
  },
  {
    id: 8,
    pair: 'UNI',
    strategy: 'Long paradex • Short lighter',
    apr: 48.9,
    price: 7.89,
    openInterest: 780000,
    paradex: 24.3,
    lighter: -24.1,
    exchanges: ['Paradex', 'Lighter']
  }
];

// Market stats
export const marketStats = {
  btc: {
    marketId: 1,
    avgSpread: 0.07,
    maxSpread: 0.08,
    price: 78500,
  },
  eth: {
    marketId: 2,
    avgSpread: 0.05,
    maxSpread: 0.06,
    price: 2397,
  }
};
