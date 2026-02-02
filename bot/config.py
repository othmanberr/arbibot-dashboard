
import os

# Strategy Configuration
# - CONVERGENCE: Capture Price Spread (Long Low / Short High) -> Close at 0 diff
# - FUNDING: Capture Funding Rate (Long Positive / Short Negative) -> Hold for income
STRATEGY_MAP = {
    "HYPE": "CONVERGENCE",
    "PAXG": "FUNDING",
    "ETH": "CONVERGENCE", # Valid backup
    "BTC": "CONVERGENCE"
}

# Derived list for scanner
SYMBOLS = list(STRATEGY_MAP.keys())

# Hyperliquid Params
HL_API_URL = "https://api.hyperliquid.xyz/info"

# Paradex Params
PARADEX_API_URL = "https://api.prod.paradex.trade/v1"

# Fee Configuration (Taker)
TAKER_FEE_HL = 0.00025 # 0.025%
TAKER_FEE_PX = 0.0     # 0.0% (No Fees)

# General
REFRESH_RATE = 0.2  # Scan every 200ms (High Frequency)
MIN_PROFIT_THRESHOLD = 0.01 # LOW THRESHOLD FOR TESTING (Was 0.20)
SIMULATION_SIZE_USD = 10 # Amount used to test liquidity/slippage
EXIT_PROFIT_THRESHOLD = 0.0 # Optimized: Exit at full convergence
