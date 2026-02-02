'use client';

import { ExternalLink } from 'lucide-react';

interface FundingCardProps {
  pair: string;
  strategy: string;
  apr: number;
  price: number;
  openInterest: number;
  exchanges: string[];
}

export default function FundingCard({
  pair,
  strategy,
  apr,
  price,
  openInterest,
  exchanges
}: FundingCardProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    }
    return `$${num}`;
  };

  return (
    <div className="bg-[#0f0f0f] rounded-xl border border-gray-800 p-6 hover:border-gray-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold mb-1">{pair}</h3>
          <p className="text-xs text-gray-400">{strategy}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-green-500">+{apr}%</p>
          <p className="text-xs text-gray-500">APR</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-400 mb-1">Price</p>
          <p className="text-sm font-medium">${price}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Open Interest</p>
          <p className="text-sm font-medium">{formatNumber(openInterest)}</p>
        </div>
      </div>

      {/* Exchanges */}
      <div className="flex gap-2 flex-wrap">
        {exchanges.map((exchange, index) => (
          <a
            key={index}
            href="#"
            className="flex items-center gap-1 px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-lg hover:bg-blue-500/20 transition-colors"
          >
            {exchange}
            <ExternalLink className="w-3 h-3" />
          </a>
        ))}
      </div>
    </div>
  );
}
