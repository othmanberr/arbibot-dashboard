
import asyncio
import os
import sys
from datetime import datetime
from rich.layout import Layout
from rich.live import Live
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich.console import Console
from core.scanner import Scanner
from core.executor import Executor
from config import REFRESH_RATE, MIN_PROFIT_THRESHOLD

class ArbiBotDashboard:
    def __init__(self):
        self.console = Console()
        self.layout = Layout()
        self.layout.split(
            Layout(name="header", size=3),
            Layout(name="main", ratio=1),
            Layout(name="footer", size=3)
        )
        self.layout["main"].split_row(
            Layout(name="left", ratio=1),
            Layout(name="right", ratio=1)
        )
        self.layout["left"].split_column(
            Layout(name="scanner", ratio=2),
            Layout(name="positions", ratio=1)
        )
        # We will render logs directly into 'right'
        
        self.log_history = []

    def log(self, message: str, level: str = "INFO"):
        time_str = datetime.now().strftime('%H:%M:%S')
        color = "blue"
        if level == "TRADE": color = "green"
        if level == "WARNING": color = "yellow"
        if level == "ERROR": color = "red"
        
        self.log_history.append(f"[dim]{time_str}[/dim] [{color}]{level}[/{color}] {message}")
        if len(self.log_history) > 30:
            self.log_history.pop(0)

    def generate_header(self) -> Panel:
        grid = Table.grid(expand=True)
        grid.add_column(justify="left", ratio=1)
        grid.add_column(justify="right")
        grid.add_row(
            "[b cyan]ARBI-BOT v1.0[/b cyan] | [green]ONLINE[/green] 🟢", 
            f"[dim]{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}[/dim]"
        )
        return Panel(grid, style="white on black")

    def generate_scanner_table(self, opps: list) -> Panel:
        table = Table(title="Live Arbitrage Scanner", expand=True, border_style="green", header_style="bold green")
        table.add_column("Symbol", justify="center")
        table.add_column("Spread", justify="right")
        table.add_column("Status", justify="center")

        if not opps:
             table.add_row("-", "-", "Scanning...")
        else:
            for opp in opps:
                sym = opp['symbol']
                spread = f"[{opp['color']}]{opp['spread']:+.2f}%[/{opp['color']}]"
                status = f"[{opp['color']}]{opp['status']}[/{opp['color']}]"
                table.add_row(sym, spread, status)
        
        return Panel(table, title="Market Feeds", border_style="blue")

    def generate_positions_table(self, positions: dict, current_opps: dict) -> Panel:
        table = Table(title="Active Strategies", expand=True, border_style="magenta")
        table.add_column("Symbol")
        table.add_column("Entry")
        table.add_column("Current")
        table.add_column("PnL (Est)")

        if not positions:
            table.add_row("-", "-", "-", "-")
        else:
            for sym, pos in positions.items():
                entry = f"{pos['entry_spread']:.2f}%"
                
                # Find current spread from scanner data
                curr_spread = 0.0
                if sym in current_opps:
                    curr_spread = current_opps[sym]['spread']
                
                current = f"{curr_spread:.2f}%"
                
                # PnL: entry - current (approx)
                # Entry 0.5, Current 0.1 => Gain 0.4
                # Entry -0.5, Current -0.1 => Gain 0.4
                pnl_pts = abs(pos['entry_spread']) - abs(curr_spread)
                color = "green" if pnl_pts > 0 else "red"
                pnl = f"[{color}]{pnl_pts:+.2f}%[/{color}]"
                
                table.add_row(sym, entry, current, pnl)

        return Panel(table, title="Active Portfolio (Convergence)", border_style="magenta")

    def generate_log_panel(self) -> Panel:
        text = Text("\n".join(self.log_history))
        return Panel(text, title="System Logs", border_style="yellow")

    def generate_footer(self) -> Panel:
        text = Text(f"Press Ctrl+C to stop | Mode: AUTO-PILOT (Limit: {MIN_PROFIT_THRESHOLD}%)", justify="center", style="dim")
        return Panel(text, style="white on black")

    def update(self, opps: list = None, positions: dict = None):
        self.layout["header"].update(self.generate_header())
        
        # Convert opps list to dict for position lookup
        opps_dict = {o['symbol']: o for o in opps} if opps else {}
        
        self.layout["scanner"].update(self.generate_scanner_table(opps))
        self.layout["positions"].update(self.generate_positions_table(positions, opps_dict))
        
        # Fixed: Update 'right' directly instead of looking for 'log'
        self.layout["right"].update(self.generate_log_panel())
        
        self.layout["footer"].update(self.generate_footer())
        return self.layout

from rich.prompt import Prompt
import re

def save_config_file(min_profit, sim_size):
    """Persist settings to config.py"""
    try:
        with open("bot/config.py", "r") as f:
            content = f.read()
            
        # Regex replacement
        content = re.sub(r"MIN_PROFIT_THRESHOLD = [\d\.]+", f"MIN_PROFIT_THRESHOLD = {min_profit}", content)
        content = re.sub(r"SIMULATION_SIZE_USD = [\d\.]+", f"SIMULATION_SIZE_USD = {sim_size}", content)
        
        with open("bot/config.py", "w") as f:
            f.write(content)
        return True
    except Exception as e:
        return False

def show_menu(console, current_profit, current_size):
    console.print("\n[bold yellow]⏸  PAUSED[/bold yellow]")
    console.print(f"Current Settings: Threshold={current_profit}%, Size=${current_size}")
    console.print("[1] Resume")
    console.print("[2] Settings")
    console.print("[3] Exit")
    return Prompt.ask("Select option", choices=["1", "2", "3"], default="1")

def run_settings(console, current_profit, current_size):
    console.print("\n[bold cyan]⚙️  CONFIGURATION[/bold cyan]")
    
    new_profit = Prompt.ask("Minimum Profit Threshold (%)", default=str(current_profit))
    new_size = Prompt.ask("Simulation Trade Size ($)", default=str(current_size))
    
    if save_config_file(new_profit, new_size):
        console.print("[green]✔ Settings saved to config.py[/green]")
    else:
        console.print("[red]✘ Failed to save config.py[/red]")
        
    return float(new_profit), float(new_size)

async def main():
    dashboard = ArbiBotDashboard()
    scanner = Scanner()
    executor = Executor()
    
    # Initialize from config (runtime copy)
    runtime_profit = MIN_PROFIT_THRESHOLD
    runtime_size = getattr(executor, 'trade_size', 100) # Get from executor init
    
    dashboard.log("Initializing Core Systems...", "INFO")
    await scanner.start()
    dashboard.log(f"Connected to Feeds. Threshold: {runtime_profit}%", "INFO")
    
    app_running = True
    
    while app_running:
        try:
            # Live Dashboard Loop
            with Live(dashboard.update([], {}), refresh_per_second=4, screen=True) as live:
                while True:
                    # Fetch Live Data
                    opps = await scanner.scan()
                    
                    # 1. Executor: Evaluate Entries
                    for opp in opps:
                        action = await executor.evaluate_entry(opp)
                        if action == "OPENED":
                            dashboard.log(f"Opened Position on {opp['symbol']}", "TRADE")

                    # 2. Executor: Manage Exits
                    await executor.check_active_positions(opps)
                    
                    live.update(dashboard.update(opps, executor.active_positions))
                    await asyncio.sleep(REFRESH_RATE)
                    
        except KeyboardInterrupt:
            # Pause Menu
            choice = show_menu(dashboard.console, runtime_profit, runtime_size)
            
            if choice == "1":
                dashboard.log("Resuming...", "INFO")
                continue
            elif choice == "2":
                runtime_profit, runtime_size = run_settings(dashboard.console, runtime_profit, runtime_size)
                executor.update_settings(runtime_profit, runtime_size)
                # Update Footer info if needed or log it
                dashboard.log(f"Settings Updated: >{runtime_profit}%", "WARNING")
                input("Press Enter to Resume...")
                continue
            elif choice == "3":
                app_running = False
                print("Exiting...")
                
        finally:
            if not app_running:
                await scanner.stop()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
    except Exception as e:
        print(f"Fatal Error: {e}")
