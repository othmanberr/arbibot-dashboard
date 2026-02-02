
import { Trade } from '@/lib/hooks/usePaperTrading';
import { XCircle, TrendingUp, History, Wallet, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface PaperTradingPanelProps {
    activeTrades: Trade[];
    tradeHistory: Trade[];
    onCloseTrade: (id: string) => void;
    totalRealizedPnL: number;
    totalUnrealizedPnL: number;
    isAutoPilot: boolean;
    setIsAutoPilot: (v: boolean) => void;
}

export default function PaperTradingPanel({
    activeTrades,
    tradeHistory,
    onCloseTrade,
    totalRealizedPnL,
    totalUnrealizedPnL,
    isAutoPilot,
    setIsAutoPilot
}: PaperTradingPanelProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

    const totalPnL = totalRealizedPnL + totalUnrealizedPnL;

    return (
        <div className={`fixed bottom-0 left-0 right-0 bg-[#0c1210] border-t border-[#1a2e26] shadow-2xl transition-all duration-300 z-50 ${isExpanded ? 'h-80' : 'h-12'}`}>

            {/* Header / Toggle Bar */}
            <div
                className="h-12 flex items-center justify-between px-6 cursor-pointer hover:bg-[#1a2e26]/50"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 font-bold text-white">
                        <Wallet className="w-4 h-4 text-purple-400" />
                        <span>Paper Trading Simulator</span>
                    </div>

                    <div className="flex items-center gap-4 text-sm font-mono border-l border-gray-700 pl-4">
                        <span className="text-gray-400">Realized:
                            <span className={totalRealizedPnL >= 0 ? 'text-green-400 ml-1' : 'text-red-400 ml-1'}>
                                ${totalRealizedPnL.toFixed(2)}
                            </span>
                        </span>
                        <span className="text-gray-400">Unrealized:
                            <span className={totalUnrealizedPnL >= 0 ? 'text-green-400 ml-1' : 'text-red-400 ml-1'}>
                                ${totalUnrealizedPnL.toFixed(2)}
                            </span>
                        </span>
                        <span className="text-gray-400 font-bold">Total:
                            <span className={totalPnL >= 0 ? 'text-green-400 ml-1' : 'text-red-400 ml-1'}>
                                ${totalPnL.toFixed(2)}
                            </span>
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-gray-400">
                    {/* Auto-Pilot Toggle */}
                    <div
                        className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all cursor-pointer ${isAutoPilot ? 'bg-green-900/30 border-green-500/50 text-green-400' : 'bg-gray-900/30 border-gray-700 text-gray-500'}`}
                        onClick={(e) => { e.stopPropagation(); setIsAutoPilot(!isAutoPilot); }}
                    >
                        <div className={`w-2 h-2 rounded-full ${isAutoPilot ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                        <span className="text-xs font-bold uppercase tracking-wider">
                            {isAutoPilot ? 'Auto-Pilot ON' : 'Manual'}
                        </span>
                    </div>

                    {activeTrades.length > 0 && (
                        <span className="bg-purple-900/50 text-purple-300 text-xs px-2 py-0.5 rounded-full border border-purple-500/30">
                            {activeTrades.length} Active
                        </span>
                    )}
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </div>
            </div>

            {/* Content Area */}
            {isExpanded && (
                <div className="h-[calc(100%-3rem)] flex flex-col">
                    {/* Tabs */}
                    <div className="flex px-6 border-b border-[#1a2e26] bg-[#0f1a16]">
                        <button
                            onClick={(e) => { e.stopPropagation(); setActiveTab('active'); }}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'active' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                        >
                            Active Positions ({activeTrades.length})
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setActiveTab('history'); }}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                        >
                            Trade History ({tradeHistory.length})
                        </button>
                    </div>

                    {/* Tables */}
                    <div className="flex-1 overflow-auto p-4 bg-[#0a0f0d]">
                        {activeTab === 'active' ? (
                            // ACTIVE TRADES TABLE
                            <table className="w-full text-left text-sm">
                                <thead className="text-gray-500 border-b border-[#1a2e26]">
                                    <tr>
                                        <th className="pb-2 pl-2">Time</th>
                                        <th className="pb-2">Token</th>
                                        <th className="pb-2">Direction</th>
                                        <th className="pb-2">Size</th>
                                        <th className="pb-2">Max PnL (Potential)</th>
                                        <th className="pb-2">Current PnL</th>
                                        <th className="pb-2 text-right pr-2">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeTrades.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="text-center py-8 text-gray-500">
                                                No active trades. Click "Simulate" on an opportunity to start.
                                            </td>
                                        </tr>
                                    )}
                                    {activeTrades.map(trade => {
                                        // Calculate duration
                                        const durationMs = Date.now() - trade.entryTime;
                                        const durationMins = Math.floor(durationMs / 60000);
                                        const durationSecs = Math.floor((durationMs % 60000) / 1000);
                                        const durationStr = `${durationMins}m ${durationSecs}s`;

                                        return (
                                            <tr key={trade.id} className="border-b border-[#1a2e26]/50 hover:bg-[#1a2e26]/30">
                                                <td className="py-2 pl-2 text-gray-400">
                                                    <div className="flex flex-col">
                                                        <span>{new Date(trade.entryTime).toLocaleTimeString()}</span>
                                                        <span className="text-[10px] text-gray-600">{durationStr}</span>
                                                    </div>
                                                </td>
                                                <td className="py-2 font-bold text-white">{trade.token}</td>
                                                <td className="py-2 text-xs">
                                                    {trade.direction === 'LongHL_ShortPx' ? (
                                                        <span className="text-blue-300">Long HL / Short Px</span>
                                                    ) : (
                                                        <span className="text-orange-300">Long Px / Short HL</span>
                                                    )}
                                                </td>
                                                <td className="py-2 text-gray-300">{trade.size}</td>

                                                {/* MAX PnL Column */}
                                                <td className="py-2">
                                                    <span className="text-green-500 font-bold font-mono text-xs block">
                                                        Max: +${(trade.maxPnL || 0).toFixed(4)}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500">
                                                        (since open)
                                                    </span>
                                                </td>

                                                <td className={`py-2 font-bold font-mono ${(trade.currentPnL || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                    {(trade.currentPnL || 0) >= 0 ? '+' : ''}${(trade.currentPnL || 0).toFixed(4)}
                                                </td>
                                                <td className="py-2 text-right pr-2">
                                                    <button
                                                        onClick={() => onCloseTrade(trade.id)}
                                                        className="text-xs bg-red-900/30 text-red-400 border border-red-900/50 hover:bg-red-900/50 px-2 py-1 rounded flex items-center gap-1 ml-auto"
                                                    >
                                                        <XCircle className="w-3 h-3" /> Close
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            // HISTORY TABLE
                            <table className="w-full text-left text-sm">
                                <thead className="text-gray-500 border-b border-[#1a2e26]">
                                    <tr>
                                        <th className="pb-2 pl-2">Exit Time</th>
                                        <th className="pb-2">Token</th>
                                        <th className="pb-2">Direction</th>
                                        <th className="pb-2">Final PnL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tradeHistory.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="text-center py-8 text-gray-500">
                                                History is empty.
                                            </td>
                                        </tr>
                                    )}
                                    {tradeHistory.map(trade => (
                                        <tr key={trade.id} className="border-b border-[#1a2e26]/50">
                                            <td className="py-2 pl-2 text-gray-400">{trade.exitTime ? new Date(trade.exitTime).toLocaleTimeString() : '-'}</td>
                                            <td className="py-2 font-bold text-white">{trade.token}</td>
                                            <td className="py-2 text-xs text-gray-400">
                                                {trade.direction === 'LongHL_ShortPx' ? 'L:HL / S:Px' : 'L:Px / S:HL'}
                                            </td>
                                            <td className={`py-2 font-bold font-mono ${(trade.exitPnL || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {(trade.exitPnL || 0) >= 0 ? '+' : ''}${(trade.exitPnL || 0).toFixed(4)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
