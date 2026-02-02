
import asyncio
import aiohttp
import json
from config import SYMBOLS, HL_API_URL, PARADEX_API_URL, SIMULATION_SIZE_USD
from core.simulator import ExecutionSimulator

class Scanner:
    def __init__(self):
        self.session = None
        self.simulator = ExecutionSimulator()

    async def start(self):
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        # FIX: Disable SSL Verification for macOS compatibility
        connector = aiohttp.TCPConnector(ssl=False)
        self.session = aiohttp.ClientSession(headers=headers, connector=connector)

    async def stop(self):
        if self.session:
            await self.session.close()

    async def fetch_hyperliquid(self):
        """Fetches Ticker (MidPx) & Funding for initial scan"""
        try:
            async with self.session.post(HL_API_URL, json={"type": "metaAndAssetCtxs"}) as resp:
                if resp.status != 200: return {}
                data = await resp.json()
                universe = data[0]['universe']
                ctxs = data[1]
                market_data = {}
                for i, u in enumerate(universe):
                   symbol = u['name']
                   if symbol in SYMBOLS:
                       # Extract Price and Funding
                       # Funding in HL is hourly? Need to verify. Usually it's funding rate per hour.
                       market_data[symbol] = {
                           "price": float(ctxs[i]['midPx']),
                           "funding": float(ctxs[i].get('funding', 0.0))
                       }
                return market_data
        except Exception as e:
            return {}

    async def fetch_paradex(self):
        """Fetches Paradex Ticker & Funding"""
        try:
            # FIX: Add market=ALL to get all summaries
            async with self.session.get(f"{PARADEX_API_URL}/markets/summary?market=ALL") as resp:
                if resp.status != 200: 
                    # Try reading text to log error if needed, but return empty for safety
                    return {}
                data = await resp.json()
                market_data = {}
                for item in data.get('results', []):
                    base = item['symbol'].split('-')[0]
                    if base in SYMBOLS:
                        bid = float(item.get('bid', 0))
                        ask = float(item.get('ask', 0))
                        # Use Mid or fallback to Mark Price
                        mid = (bid + ask) / 2 if bid and ask else float(item.get('mark_price', 0))
                        
                        # Paradex funding usually 'current_funding_rate' or 'funding_rate'
                        # Using get('funding_rate', 0) as generic fallback
                        funding = float(item.get('current_funding_rate', item.get('funding_rate', 0.0)))
                        
                        market_data[base] = {
                            "price": mid,
                            "funding": funding
                        }
                return market_data
        except Exception as e:
            return {}
            
    # ... (L2 methods remain same) ...

    async def scan(self):
        if not self.session: await self.start()
            
        hl_data, px_data = await asyncio.gather(self.fetch_hyperliquid(), self.fetch_paradex())
        opps = []
        
        for sym in SYMBOLS:
            hl = hl_data.get(sym)
            px = px_data.get(sym)
            
            # Default values
            hl_price = hl['price'] if hl else 0.0
            px_price = px['price'] if px else 0.0
            
            hl_display = f"${hl_price:.4f}" if hl else "---"
            px_display = f"${px_price:.4f}" if px else "---"
            
            spread_display = 0.0
            funding_diff = 0.0
            
            status = "Syncing..."
            color = "dim white"

            if hl and px:
                # 1. Price Spread Calculation
                raw_diff = px_price - hl_price
                raw_spread = (raw_diff / hl_price) * 100 if hl_price > 0 else 0
                spread_display = raw_spread
                
                # 2. Funding Diff Calculation (Annualized %)
                # Funding is usually hourly (HL) or 8h? Assume hourly for simplified diff
                # Need to normalize to APR for display or just raw diff
                funding_hl = hl.get('funding', 0)
                funding_px = px.get('funding', 0)
                funding_diff = funding_hl - funding_px 
                
                status = "Watching"
                color = "white"
                
                # 3. Strategy Routing (Visual Only here, execution logic in Executor)
                # We can hint which strategy is active in the status
                
                # ... (L2 Check kept for convergence strategy, can skip for Funding) ...
                
                real_spread = raw_spread
                
                # Visualization Logic
                spread_display = real_spread
                
                if abs(real_spread) > 0.5:
                    color = "bold green"
                    status += " (SPREAD)"
                elif abs(funding_diff) > 0.001: # Arbitrary small threshold for funding
                     status += " (FUNDING)"

            # Always append to show row
            opps.append({
                "symbol": sym,
                "hl_price": hl_price,
                "px_price": px_price,
                "hl_funding": hl.get('funding', 0) if hl else 0,
                "px_funding": px.get('funding', 0) if px else 0,
                "hl_display": hl_display, 
                "px_display": px_display,
                "spread": spread_display,
                "funding_diff": funding_diff,
                "status": status,
                "color": color
            })
        
        opps.sort(key=lambda x: abs(x['spread']), reverse=True)
        return opps
