'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  TrendingUp,
  DollarSign,
  Percent,
  BarChart3,
  Target,
  ChevronRight,
  Zap,
  Layers,
  Activity
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Global Dashboard', icon: TrendingUp },
  { href: '/arbitrage-prices', label: 'Arbitrage Scanner', icon: DollarSign },
  { href: '/fundings-rate', label: 'Funding Rates', icon: Percent },
  { href: '/trading-analysis', label: 'Analysis', icon: BarChart3 },
  { href: '/open-interest', label: 'Open Interest', icon: Target },
];

const exchanges = [
  { name: 'Hyperliquid', icon: '⚡' },
  { name: 'Paradex', icon: '🔥' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-72 h-screen bg-[#050505]/95 backdrop-blur-xl border-r border-[#1a1a1a] flex flex-col shadow-2xl z-50">

      {/* Brand Header */}
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-lg shadow-green-900/40">
            <Zap className="w-6 h-6 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">ArbiBot <span className="text-green-500">.AI</span></h1>
            <p className="text-[10px] text-gray-500 font-medium tracking-widest uppercase">High Frequency System</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">

        {/* Menu Group */}
        <div className="space-y-2">
          <h3 className="px-4 text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Main Platform</h3>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 relative
                  ${isActive
                    ? 'bg-green-500/10 text-green-400 font-semibold'
                    : 'text-gray-400 hover:text-white hover:bg-[#111]'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-green-500 rounded-r-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                )}
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-green-500' : 'text-gray-500 group-hover:text-gray-300'}`} />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto text-green-500/50" />}
              </Link>
            );
          })}
        </div>

        {/* Connected Exchanges */}
        <div className="space-y-3">
          <h3 className="px-4 text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            Active Data Feeds <Activity className="w-3 h-3 text-green-500 animate-pulse" />
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {exchanges.map((ex) => (
              <div key={ex.name} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111] border border-[#222] text-xs text-gray-300">
                <span>{ex.icon}</span>
                {ex.name}
              </div>
            ))}
          </div>
        </div>

        {/* System Stats */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-[#222]">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-bold text-gray-300">System Status</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>Latency</span>
              <span className="text-green-400">12ms</span>
            </div>
            <div className="h-1 w-full bg-[#222] rounded-full overflow-hidden">
              <div className="h-full w-[80%] bg-green-500 rounded-full animate-pulse" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
