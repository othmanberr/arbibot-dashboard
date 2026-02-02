
import asyncio
import os
import sys
import aiohttp
import json

# Ensure we can import from local directory
sys.path.append(os.getcwd())

from config import SYMBOLS, HL_API_URL, PARADEX_API_URL

async def debug_raw():
    print(f"--- Debugging Raw API Responses ---")
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    async with aiohttp.ClientSession(headers=headers, connector=aiohttp.TCPConnector(ssl=False)) as session:
        # 1. Hyperliquid
        print("\n[HYPERLIQUID] Requesting info...")
        try:
            async with session.post(HL_API_URL, json={"type": "metaAndAssetCtxs"}) as resp:
                print(f"Status: {resp.status}")
                if resp.status == 200:
                    data = await resp.json()
                    # Inspect structure
                    print(f"Data Type: {type(data)}")
                    if isinstance(data, list) and len(data) > 0:
                        print(f"Item 0 keys: {data[0].keys()}")
                        if 'universe' in data[0]:
                            uni = data[0]['universe']
                            print(f"Universe size: {len(uni)}")
                            if len(uni) > 0:
                                print(f"First Asset: {uni[0]}")
                                # Check if our symbols exist
                                found = [u['name'] for u in uni if u['name'] in SYMBOLS]
                                print(f"Found Symbols in Universe: {found}")
                                
                        if len(data) > 1:
                            ctxs = data[1]
                            print(f"Ctxs size: {len(ctxs)}")
                            if len(ctxs) > 0:
                                print(f"First Ctx: {ctxs[0]}")

        except Exception as e:
            print(f"CRASH HL: {e}")

        # 2. Paradex
        print("\n[PARADEX] Requesting markets (Attempt 1: /markets)...")
        try:
            # Try basic markets endpoint first
            async with session.get(f"{PARADEX_API_URL}/markets") as resp:
                print(f"Status: {resp.status}")
                text = await resp.text()
                print(f"Response: {text[:200]}...") # Print first 200 chars
                
        except Exception as e:
            print(f"CRASH PX 1: {e}")
            
        print("\n[PARADEX] Requesting summary (Attempt 2: /markets/summary?market=ALL)...")
        try:
            async with session.get(f"{PARADEX_API_URL}/markets/summary?market=ALL") as resp:
                print(f"Status: {resp.status}")
                if resp.status == 200:
                    data = await resp.json()
                    print(f"Data type: {type(data)}")
                    # Paradex often returns { results: [...] } OR direct list [...]
                    results = data.get('results', []) if isinstance(data, dict) else data
                    print(f"Results type: {type(results)}")
                    print(f"Results len: {len(results)}")
                    
                    if len(results) > 0:
                        print(f"Sample item: {results[0]}")
                        
                        # Test parsing
                        found = []
                        for item in results:
                            sym = item.get('symbol', 'UNKNOWN')
                            base = sym.split('-')[0]
                            if base in SYMBOLS:
                                price = item.get('mark_price', item.get('last_traded_price', 'N/A'))
                                found.append(f"{base} ({price})")
                        print(f"Matched Symbols: {found}")
                else:
                    text = await resp.text()
                    print(f"Error Body: {text}") 
        except Exception as e:
            print(f"CRASH PX 2: {e}")

if __name__ == "__main__":
    try:
        asyncio.run(debug_raw())
    except KeyboardInterrupt:
        pass
