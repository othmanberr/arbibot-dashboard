
import time
from datetime import datetime
from rich.console import Console
from config import MIN_PROFIT_THRESHOLD, EXIT_PROFIT_THRESHOLD, SIMULATION_SIZE_USD, STRATEGY_MAP, TAKER_FEE_HL, TAKER_FEE_PX

class Executor:
    def __init__(self):
        self.console = Console()
        self.active_positions = {}
        self.trade_log = []
        self.min_profit = MIN_PROFIT_THRESHOLD
        self.exit_threshold = EXIT_PROFIT_THRESHOLD
        self.trade_size = SIMULATION_SIZE_USD
        
    def update_settings(self, min_profit, trade_size):
        self.min_profit = float(min_profit)
        self.trade_size = float(trade_size)
        self.log_trade(f"CONFIG UPDATED: Min Profit {self.min_profit}% | Size ${self.trade_size}")

    def log_trade(self, message):
        timestamp = datetime.now().strftime('%H:%M:%S')
        self.trade_log.append(f"[{timestamp}] {message}")
        if len(self.trade_log) > 50:
            self.trade_log.pop(0)

    async def evaluate_entry(self, opp: dict):
        symbol = opp['symbol']
        strategy = STRATEGY_MAP.get(symbol, "CONVERGENCE")
        
        if symbol in self.active_positions:
            return "SKIPPED (ACTIVE)"

        if strategy == "CONVERGENCE":
            return await self.evaluate_convergence(opp)
        elif strategy == "FUNDING":
            return await self.evaluate_funding(opp)
        
        return "WAITING"
    
    async def evaluate_convergence(self, opp):
        """Standard Buy Low / Sell High"""
        spread = opp['spread']
        symbol = opp['symbol']
        
        # Fee Logic
        total_fees = (TAKER_FEE_HL + TAKER_FEE_PX) * 100 # Convert to %
        net_spread = abs(spread) - total_fees
        
        if net_spread >= self.min_profit:
            direction = "ShortPX_LongHL" if spread > 0 else "ShortHL_LongPX"
            self.log_trade(f"⚡ SPREAD: {symbol} | Gross: {spread:+.2f}% | Net: {net_spread:+.2f}% | {direction}")
            
            self.active_positions[symbol] = {
                "strategy": "CONVERGENCE",
                "entry_time": time.time(),
                "entry_val": spread, 
                "direction": direction,
                "status": "OPEN",
                "entry_spread": spread
            }
            return "OPENED"
        return "WAITING"

    async def evaluate_funding(self, opp):
        """Capture Positive Funding Rates"""
        # Goal: Find net positive funding.
        # If HL Funding > 0 (Pays Short), PX Funding < 0 (Pays Long).
        # We want to Receive > Pay.
        
        hl_funding = opp.get('hl_funding', 0)
        px_funding = opp.get('px_funding', 0)
        symbol = opp['symbol']
        
        # Scenario A: Short HL / Long PX
        # Net = HL_Funding (Receive if >0) + PX_Funding (Receive if <0 is paid.. wait. Short pays +funding, Long pays -funding usually)
        # Correction:
        # Long pays Funding if > 0. Receives if < 0.
        # Short receives Funding if > 0. Pays if < 0.
        
        # Strategy A (Short HL / Long PX):
        # Income = HL_Funding (Recv) - PX_Funding (Pay)
        income_a = hl_funding - px_funding 
        
        # Strategy B (Long HL / Short PX):
        # Income = -HL_Funding (Pay) + PX_Funding (Recv)
        income_b = px_funding - hl_funding
        
        best_income = max(income_a, income_b)
        # Threshold: e.g., 0.001% per hour (approx 8% APR)
        FUNDING_THRESHOLD = 0.001 
        
        if best_income > FUNDING_THRESHOLD:
            direction = "ShortHL_LongPX" if income_a > income_b else "LongHL_ShortPX"
            fmt_income = best_income * 24 * 365 # APR approx
            self.log_trade(f"💸 FUNDING: {symbol} | Net APR: {fmt_income:.0f}% | {direction}")
             
            self.active_positions[symbol] = {
                "strategy": "FUNDING",
                "entry_time": time.time(),
                "entry_val": best_income,
                "direction": direction,
                "status": "OPEN",
                "entry_spread": 0.0 # Placeholder
            }
            return "OPENED"
            
        return "WAITING"

    async def check_active_positions(self, current_opps: list):
        market_map = {o['symbol']: o for o in current_opps}
        positions_to_close = []
        
        for symbol, pos in self.active_positions.items():
            if symbol not in market_map: continue
            opp = market_map[symbol]
            
            if pos.get("strategy") == "CONVERGENCE":
                # Exit on Spread Convergence
                curr_spread_abs = abs(opp['spread'])
                if curr_spread_abs <= self.exit_threshold:
                     positions_to_close.append((symbol, "Converged"))
                     
            elif pos.get("strategy") == "FUNDING":
                # Exit if Funding turns negative/unprofitable
                # Recalculate income same way
                hl_f = opp.get('hl_funding', 0)
                px_f = opp.get('px_funding', 0)
                
                direction = pos['direction']
                current_income = 0
                if direction == "ShortHL_LongPX":
                    current_income = hl_f - px_f
                else:
                    current_income = px_f - hl_f
                
                # Close if income drops to 0 or negative
                if current_income <= 0:
                    positions_to_close.append((symbol, "Funding Dried Up"))

        for symbol, reason in positions_to_close:
            await self.close_position(symbol, reason)

    async def close_position(self, symbol: str, reason: str):
        self.log_trade(f"CLOSE {symbol} | Reason: {reason}")
        if symbol in self.active_positions:
            del self.active_positions[symbol]

    async def process_opportunity(self, opp):
        return await self.evaluate_entry(opp)
