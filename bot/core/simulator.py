
class ExecutionSimulator:
    def __init__(self):
        # Taker Fees (Approximate public rates)
        # Hyperliquid: 0.025% Taker
        # Paradex: 0.03% Taker (Adjust as needed)
        self.FEES = {
            'Hyperliquid': 0.00025,
            'Paradex': 0.0003
        }

    def calculate_vwap(self, book: list, size_usd: float) -> float:
        """
        Calculates Volume Weighted Average Price for a buy/sell.
        book: List of [price, size_in_token] sorted by best price first.
        size_usd: Total USD amount to execute.
        """
        remaining_usd = size_usd
        total_tokens = 0.0
        weighted_sum = 0.0

        for price, size in book:
            price = float(price)
            size = float(size)
            
            # Value of this level
            level_usd = price * size
            
            take_usd = min(remaining_usd, level_usd)
            take_tokens = take_usd / price
            
            weighted_sum += price * take_tokens
            total_tokens += take_tokens
            remaining_usd -= take_usd
            
            if remaining_usd <= 0.0001:
                break
        
        # If we exhausted the book but didn't fill trade
        if remaining_usd > 1.0: 
            return None # Liquidity too low for this size
            
        if total_tokens == 0:
            return 0.0

        return weighted_sum / total_tokens

    def simulate_trade(self, opportunity: dict, size_usd: float = 1000.0) -> dict:
        """
        Simulates entry and exit with fees and slippage.
        opportunity: Contains 'l2_hl' and 'l2_px' books.
        """
        symbol = opportunity['symbol']
        
        # Hyperliquid Book (l2_hl)
        # Paradex Book (l2_px)
        # format: {'bids': [[px, sz], ...], 'asks': [[px, sz], ...]}
        
        l2_hl = opportunity.get('l2_hl')
        l2_px = opportunity.get('l2_px')
        
        if not l2_hl or not l2_px:
            return {"error": "No L2 Data"}

        # Direction logic from Scanner (Simplified here, usually passed in)
        # If HL > PX => Short HL (Bid), Long PX (Ask)
        # If PX > HL => Short PX (Bid), Long HL (Ask)
        
        # We need to re-detect direction based on mid or use passed direction.
        # Let's assume passed direction or re-calc best.
        
        # Calculate raw execution prices (slippage included)
        # Scenario A: Short HL, Long PX
        hl_bid_vwap = self.calculate_vwap(l2_hl['bids'], size_usd) # Sell to bids
        px_ask_vwap = self.calculate_vwap(l2_px['asks'], size_usd) # Buy from asks
        
        # Scenario B: Short PX, Long HL
        px_bid_vwap = self.calculate_vwap(l2_px['bids'], size_usd) # Sell to bids
        hl_ask_vwap = self.calculate_vwap(l2_hl['asks'], size_usd) # Buy from asks
        
        results = {}

        # Analyze Scenario A (Short HL / Long PX)
        if hl_bid_vwap and px_ask_vwap:
            # Profit = (Short_Entry - Long_Entry) / Long_Entry
            # or simply PnL in USD = (Sell Price - Buy Price) * Token_Amt?
            # Let's stick to % Spread for normalization
            
            gross_upside = hl_bid_vwap - px_ask_vwap
            # Fees: size * (fee_hl + fee_px)
            fees_pct = self.FEES['Hyperliquid'] + self.FEES['Paradex']
            net_upside = gross_upside - (px_ask_vwap * fees_pct) # Approx fee deduction in price terms
            
            spread_pct = (net_upside / px_ask_vwap) * 100
            results['ShortHL_LongPX'] = {
                'spread_net': spread_pct, 
                'entry_hl': hl_bid_vwap, 
                'entry_px': px_ask_vwap
            }

        # Analyze Scenario B (Short PX / Long HL)
        if px_bid_vwap and hl_ask_vwap:
            gross_upside = px_bid_vwap - hl_ask_vwap
            fees_pct = self.FEES['Hyperliquid'] + self.FEES['Paradex']
            net_upside = gross_upside - (hl_ask_vwap * fees_pct)
            
            spread_pct = (net_upside / hl_ask_vwap) * 100
            results['ShortPX_LongHL'] = {
                'spread_net': spread_pct, 
                'entry_hl': hl_ask_vwap, 
                'entry_px': px_bid_vwap,
                'fees_paid': fees_pct * 100
            }

        return results
