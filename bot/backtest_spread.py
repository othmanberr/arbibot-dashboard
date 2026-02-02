
import asyncio
import aiohttp
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import time
from rich.console import Console
from rich.table import Table

console = Console()

# Configuration
SYMBOL = "ETH" # Analyzing ETH as the benchmark
TIMEFRAME = "15m" # 15 minute candles
DAYS_LOOKBACK = 7
LEVERAGE_OPTIONS = [1, 5, 10, 20]

async def fetch_hl_candles(session):
    """Fetch Hyperliquid Candles"""
    url = "https://api.hyperliquid.xyz/info"
    # HL uses ms timestamps
    end_time = int(time.time() * 1000)
    start_time = int((datetime.now() - timedelta(days=DAYS_LOOKBACK)).timestamp() * 1000)
    
    payload = {
        "type": "candleSnapshot",
        "req": {
            "coin": SYMBOL,
            "interval": TIMEFRAME,
            "startTime": start_time,
            "endTime": end_time
        }
    }
    
    async with session.post(url, json=payload, headers={"Content-Type": "application/json"}) as resp:
        if resp.status == 200:
            data = await resp.json()
            # HL Data: [t, o, h, l, c, v]
            df = pd.DataFrame(data, columns=['t', 'o', 'h', 'l', 'c', 'v'])
            df['timestamp'] = pd.to_datetime(df['t'], unit='ms')
            df['close'] = df['c'].astype(float)
            df = df.set_index('timestamp')
            return df[['close']]
        else:
            console.print(f"[red]Error fetching HL data: {resp.status}[/red]")
            return None

async def fetch_binance_candles(session):
    """Fetch Binance ETHUSDT Futures Candles (Benchmark)"""
    url = "https://fapi.binance.com/fapi/v1/klines"
    # Binance uses ms timestamps
    end_time = int(time.time() * 1000)
    start_time = int((datetime.now() - timedelta(days=DAYS_LOOKBACK)).timestamp() * 1000)
    
    params = {
        "symbol": f"{SYMBOL}USDT",
        "interval": TIMEFRAME,
        "startTime": start_time,
        "endTime": end_time,
        "limit": 1500 # Max limit
    }
    
    # We might need multiple calls for 7 days if limit is hit, but 15m * 7 days = ~672 candles. 1500 is enough.
    
    async with session.get(url, params=params) as resp:
        if resp.status == 200:
            data = await resp.json()
            # Binance Data: [open_time, open, high, low, close, volume, ...]
            df = pd.DataFrame(data, columns=['open_time', 'o', 'h', 'l', 'c', 'v', 'close_time', 'q', 'n', 'V', 'Q', 'B'])
            df['timestamp'] = pd.to_datetime(df['open_time'], unit='ms')
            df['close'] = df['c'].astype(float)
            df = df.set_index('timestamp')
            return df[['close']]
        else:
            console.print(f"[red]Error fetching Binance data: {resp.status}[/red]")
            return None

def backtest_strategy(spread_series, entry_threshold, exit_threshold):
    """
    Simulates trades based on spread series.
    Returns: count, total_return, max_adverse_excursion (for leverage check)
    """
    in_trade = False
    entry_spread = 0
    total_pnl = 0
    trade_count = 0
    max_drawdown_spread = 0 # How much the spread went AGAINST us
    
    stats = []

    for ts, spread in spread_series.items():
        spread_val = abs(spread) # Treating direction agnostic for spread capture
        
        if not in_trade:
            # ENTRY CONDITION
            if spread_val >= entry_threshold:
                in_trade = True
                entry_spread = spread_val
                trade_count += 1
                max_drawdown_spread = 0 # Reset for this trade
        else:
            # IN TRADE - MONITOR RISKS
            current_drawdown = spread_val - entry_spread
            if current_drawdown > max_drawdown_spread:
                max_drawdown_spread = current_drawdown
            
            # EXIT CONDITION
            if spread_val <= exit_threshold:
                in_trade = False
                fees = 0.15 
                trade_pnl = (entry_spread - spread_val) - fees
                total_pnl += trade_pnl
                
    return trade_count, total_pnl, max_drawdown_spread

async def main():
    console.print(f"[bold blue]Starting Backtest Analysis for {SYMBOL} ({DAYS_LOOKBACK} Days)...[/bold blue]")
    
    # Bypass SSL verification for MacOS/local issues
    connector = aiohttp.TCPConnector(ssl=False)
    async with aiohttp.ClientSession(connector=connector) as session:
        # Fetch Data
        t1 = fetch_hl_candles(session)
        t2 = fetch_binance_candles(session)
        hl_df, px_df = await asyncio.gather(t1, t2)
    
    if hl_df is None or px_df is None:
        console.print("[red]Failed to fetch complete data. Aborting.[/red]")
        return

    # Align Data
    # Inner join to only compare overlapping candles
    combined = hl_df.join(px_df, lsuffix='_hl', rsuffix='_px', how='inner')
    
    # Calculate Spread %
    # abs(Binance - HL) / HL * 100
    combined['spread'] = (abs(combined['close_px'] - combined['close_hl']) / combined['close_hl']) * 100
    
    avg_spread = combined['spread'].mean()
    max_spread = combined['spread'].max()
    console.print(f"Data Points: {len(combined)}")
    console.print(f"Average Spread (vs Binance): {avg_spread:.4f}%")
    console.print(f"Max Spread (vs Binance): {max_spread:.4f}%")
    
    # Grid Search Optimization
    # Hyperliquid tracks Binance very closely, so spreads are tight (0.02% - 0.15%).
    # We need to test micro-arbs.
    entry_candidates = [0.05, 0.08, 0.1, 0.15, 0.2, 0.3]
    exit_candidates = [-0.02, 0.0, 0.02, 0.05]
    
    results = []
    
    console.print("\n[bold]Simulating Strategies...[/bold]")
    table = Table(title="Optimization Results")
    table.add_column("Entry %", style="cyan")
    table.add_column("Exit %", style="cyan")
    table.add_column("Trades", style="magenta")
    table.add_column("Net Profit %", style="green")
    table.add_column("Max DD %", style="red")
    table.add_column("Safe Lev", style="yellow")

    for entry in entry_candidates:
        for exit_target in exit_candidates:
            if exit_target >= entry: continue
            
            count, pnl, max_dd = backtest_strategy(combined['spread'], entry, exit_target)
            
            if count == 0: continue

            # Determine Max Safe Leverage
            # If Max DD (spread widening) is 2%, using 50x levy = 100% loss (Limit).
            # Safety buffer: 50%.
            # Safe Lev = 1 / (Max DD * 0.01 * 2) roughly?
            # Basic rule: Liquidation = 1/Lev. 
            # We need 1/Lev > Max_DD_decimal.
            # Lev < 1 / Max_DD_decimal.
            
            safe_lev = "N/A"
            if max_dd > 0:
                limit_lev = 1 / (max_dd / 100)
                safe_lev = f"{int(limit_lev * 0.8)}x" # 20% safety buffer
            else:
                safe_lev = "Max"

            results.append({
                "entry": entry,
                "exit": exit_target,
                "trades": count,
                "pnl": pnl,
                "max_dd": max_dd,
                "safe_lev": safe_lev
            })
            
            table.add_row(
                f"{entry}%",
                f"{exit_target}%",
                str(count),
                f"{pnl:.2f}%",
                f"{max_dd:.2f}%",
                safe_lev
            )

    console.print(table)
    
    # Recommendation
    if results:
        best = max(results, key=lambda x: x['pnl'])
        console.print(f"\n[bold green]✅ Best Historical Strategy:[/bold green]")
        console.print(f"Entry: [bold]{best['entry']}%[/bold] | Exit: [bold]{best['exit']}%[/bold]")
        console.print(f"Estimated Net Profit (7d): [bold]{best['pnl']:.2f}%[/bold]")
        console.print(f"Max Safe Leverage: [bold]{best['safe_lev']}[/bold]")

if __name__ == "__main__":
    asyncio.run(main())
