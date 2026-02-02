use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use colored::*;
use serde::Deserialize;
use tokio::time;

// --- Configuration ---
const SYMBOL: &str = "HYPE"; 
// Hyperliquid needs to map HYPE to its internal name if different, but assuming HYPE works for now.
// Note: Hyperliquid API usually requires fetching 'meta' to get universe.
// We will use a simplified fetch for speed.

const MIN_ENTRY_SPREAD: f64 = 0.20;
const EXIT_SPREAD: f64 = 0.00;
const REFRESH_INTERVAL_MS: u64 = 50; // 50ms polling! (4x faster than optimized Python)
const TRADE_SIZE_USD: f64 = 100.0;

// --- Data Structures ---

#[derive(Debug, Clone)]
struct MarketData {
    symbol: String,
    hl_price: Option<f64>,
    px_price: Option<f64>,
    spread: Option<f64>,
}

#[derive(Debug, Clone)]
struct Position {
    symbol: String,
    entry_spread: f64,
    direction: String, // "ShortPX_LongHL" or "ShortHL_LongPX"
    entry_time: Instant,
}

struct BotState {
    active_positions: HashMap<String, Position>,
    pnl_history: Vec<f64>,
}

// --- API Clients ---

async fn fetch_hyperliquid_price(client: &reqwest::Client) -> Option<f64> {
    // Optimisation: Fetching all midPx is heavy. In real HFT we use WSS.
    // For REST, we hit 'metaAndAssetCtxs' or 'info'.
    // Use the 'info' endpoint for metaAndAssetCtxs
    let url = "https://api.hyperliquid.xyz/info";
    let body = serde_json::json!({ "type": "metaAndAssetCtxs" });

    match client.post(url).json(&body).send().await {
        Ok(resp) => {
            if let Ok(json) = resp.json::<serde_json::Value>().await {
                // Parse Logic: universe[i].name == SYMBOL -> ctxs[i].midPx
                if let (Some(universe), Some(ctxs)) = (json[0].get("universe"), json[1].as_array()) {
                   if let Some(univ_arr) = universe.as_array() {
                       for (i, asset) in univ_arr.iter().enumerate() {
                           if asset["name"] == SYMBOL {
                               if let Some(ctx) = ctxs.get(i) {
                                   return ctx["midPx"].as_str().and_then(|s| s.parse::<f64>().ok());
                               }
                           }
                       }
                   }
                }
            }
        }
        Err(_) => {}
    }
    None
}

async fn fetch_paradex_price(client: &reqwest::Client) -> Option<f64> {
    // Paradex Market Summary
    let url = "https://api.prod.paradex.trade/v1/markets/summary";
    // We can filter by symbol in params if API supports, or fetch all.
    // Fetching all is bandwidth heavy but Paradex API might not filter summary.
    // Let's try explicit market param if possible, else fetch all.
    let params = [("market", format!("{}-USD-PERP", SYMBOL))];
    
    // Note: Paradex specific symbol format "HYPE-USD-PERP"
    
    match client.get(url).query(&params).send().await {
        Ok(resp) => {
            if let Ok(json) = resp.json::<serde_json::Value>().await {
                // Results array
                if let Some(results) = json["results"].as_array() {
                    for res in results {
                        if let Some(sym) = res["symbol"].as_str() {
                            if sym.starts_with(SYMBOL) {
                                // Prefer Mid Price: (bid+ask)/2 or last if missing
                                let bid = res["best_bid"].as_str().and_then(|s| s.parse::<f64>().ok()).unwrap_or(0.0);
                                let ask = res["best_ask"].as_str().and_then(|s| s.parse::<f64>().ok()).unwrap_or(0.0);
                                if bid > 0.0 && ask > 0.0 {
                                    return Some((bid + ask) / 2.0);
                                }
                                return res["last_price"].as_str().and_then(|s| s.parse::<f64>().ok());
                            }
                        }
                    }
                }
            }
        }
        Err(_) => {}
    }
    None
}

// --- Main Engine ---

#[tokio::main]
async fn main() {
    println!("{}", "🚀 STARTING RUST HFT ENGINE (Target: HYPE)...".bold().green());
    println!("Strategy: Entry > {}% | Exit <= {}%", MIN_ENTRY_SPREAD, EXIT_SPREAD);
    
    let client = reqwest::Client::builder()
        .timeout(Duration::from_millis(500)) // Aggressive timeout
        .build()
        .unwrap();

    let state = Arc::new(Mutex::new(BotState {
        active_positions: HashMap::new(),
        pnl_history: Vec::new(),
    }));

    let mut interval = time::interval(Duration::from_millis(REFRESH_INTERVAL_MS));

    loop {
        interval.tick().await; // Wait for next tick
        let start = Instant::now();

        // 1. Parallel Fetch
        let (hl_res, px_res) = tokio::join!(
            fetch_hyperliquid_price(&client),
            fetch_paradex_price(&client)
        );

        // 2. Process
        if let (Some(hl), Some(px)) = (hl_res, px_res) {
            let diff = px - hl;
            let spread_pct = (diff / hl) * 100.0;
            let abs_spread = spread_pct.abs();

            // UI
            let color = if abs_spread > MIN_ENTRY_SPREAD { "green" } else { "white" };
            print!("\r[{}] HYPE | HL: ${:.4} | PX: ${:.4} | Spread: ", 
                chrono::Local::now().format("%H:%M:%S%.3f"), hl, px
            );
            
            if abs_spread > MIN_ENTRY_SPREAD {
                print!("{}", format!("{:.3}% (!!!)", spread_pct).bold().green());
            } else {
                 print!("{}", format!("{:.3}%", spread_pct).color(color));
            }

            // 3. Execution Logic
            let mut state_lock = state.lock().unwrap();
            let is_in_position = state_lock.active_positions.contains_key(SYMBOL);
            
            if is_in_position {
                // --- EXIT LOGIC ---
                let pos = state_lock.active_positions.get(SYMBOL).unwrap().clone();
                // Check Convergence
                if abs_spread <= EXIT_SPREAD {
                    // CLOSE
                    let duration = pos.entry_time.elapsed().as_secs_f64();
                    let profit_pts = pos.entry_spread.abs() - abs_spread;
                    let pnl_usd = (profit_pts / 100.0) * TRADE_SIZE_USD;
                    
                    println!("\n{}", format!("💰 CLOSE HYPE | PnL: +${:.2} | Held: {:.2}s", pnl_usd, duration).bold().magenta());
                    state_lock.active_positions.remove(SYMBOL);
                    state_lock.pnl_history.push(pnl_usd);
                }
            } else {
                // --- ENTRY LOGIC ---
                if abs_spread >= MIN_ENTRY_SPREAD {
                    // OPEN
                    let direction = if spread_pct > 0.0 { "ShortPX_LongHL" } else { "ShortHL_LongPX" };
                    println!("\n{}", format!("🚀 OPEN HYPE | Spread: {:.2}% | Dir: {}", spread_pct, direction).bold().green());
                    
                    state_lock.active_positions.insert(SYMBOL.to_string(), Position {
                        symbol: SYMBOL.to_string(),
                        entry_spread: spread_pct,
                        direction: direction.to_string(),
                        entry_time: Instant::now()
                    });
                }
            }

        } else {
             // print!("\r[WARN] Dropped Frame (API Timeout)");
        }
        
        // Flush stdout
        use std::io::Write;
        std::io::stdout().flush().unwrap();
        
        // Latency warning
        if start.elapsed().as_millis() > REFRESH_INTERVAL_MS as u128 {
             // println!("\n[WARN] Loop lag: {}ms", start.elapsed().as_millis());
        }
    }
}
