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
  Moon
} from 'lucide-react';

const navItems = [
  {
    href: '/',
    label: 'Arbitrage',
    icon: TrendingUp
  },
  {
    href: '/arbitrage-prices',
    label: 'Arbitrage Prices',
    icon: DollarSign
  },
  {
    href: '/fundings-rate',
    label: 'Fundings Rate',
    icon: Percent
  },
  {
    href: '/trading-analysis',
    label: 'Trading Analysis',
    icon: BarChart3
  },
  {
    href: '/open-interest',
    label: 'Open Interest',
    icon: Target
  },
];

const exchanges = [
  { name: 'Paradex', icon: '⚡' },
  { name: 'Lighter', icon: '🔥' },
  { name: 'Pacifica', icon: '💎' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 h-screen bg-[#0a0a0a] border-r border-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-500" />
          <h1 className="text-lg font-bold">Arbitrage Tracker</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                ${isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}

        {/* Pairs Section */}
        <div className="pt-6">
          <button className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span>Pairs</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Exchanges */}
        <div className="pt-4 space-y-1">
          {exchanges.map((exchange) => (
            <button
              key={exchange.name}
              className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:bg-gray-800/50 hover:text-white rounded-lg transition-all w-full"
            >
              <span>{exchange.icon}</span>
              <span>{exchange.name}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <button className="flex items-center justify-center w-full p-2 rounded-lg hover:bg-gray-800 transition-colors">
          <Moon className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
}
