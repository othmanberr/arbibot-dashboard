'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    // We can pass current settings here if needed
    initialThresholds?: Record<string, number>;
    onSave?: (newThresholds: Record<string, number>) => void;
}

export default function SettingsModal({ isOpen, onClose, initialThresholds, onSave }: SettingsModalProps) {
    const [thresholds, setThresholds] = useState<Record<string, number>>({
        BNB: 2,
        BTC: 40,
        ETH: 2,
        HYPE: 0.1,
        SOL: 0.5
    });

    // Load initials if provided
    useEffect(() => {
        if (initialThresholds) {
            setThresholds(initialThresholds);
        }
    }, [initialThresholds]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (onSave) onSave(thresholds);
        onClose();
    };

    const handleChange = (token: string, val: string) => {
        setThresholds(prev => ({
            ...prev,
            [token]: parseFloat(val) || 0
        }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#0c1210] border border-[#1a2e26] rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#1a2e26]">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-white">Arbitrage Thresholds Configuration</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <p className="text-sm text-gray-400 mb-6">
                        Configure the minimum price difference thresholds (USD) for each token to consider arbitrage opportunities.
                    </p>

                    <div className="space-y-4">
                        {Object.entries(thresholds).map(([token, value]) => (
                            <div key={token} className="bg-[#111a16] border border-[#1a2e26] rounded-lg p-3 flex items-center justify-between">
                                <div>
                                    <span className="font-bold text-white block">{token}</span>
                                    <span className="text-xs text-gray-500">Minimum threshold (USD)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={value}
                                        onChange={(e) => handleChange(token, e.target.value)}
                                        className="bg-black/40 border border-[#2a4e40] rounded px-3 py-1.5 text-right w-24 text-white focus:outline-none focus:border-green-600"
                                    />
                                    <span className="text-gray-500">$</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Explanation Footer */}
                    <div className="mt-8 bg-[#1a2e26]/30 rounded-lg p-4 border border-[#1a2e26]">
                        <h3 className="text-white font-bold mb-2 text-sm">How it works:</h3>
                        <ul className="text-xs text-gray-400 space-y-1">
                            <li>• <span className="text-gray-300">Interesting:</span> Price diff ≥ threshold</li>
                            <li>• <span className="text-gray-300">Hot:</span> Price diff ≥ 3x threshold</li>
                            <li>• Higher thresholds = fewer but more profitable opportunities</li>
                        </ul>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-[#1a2e26] flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-400 hover:text-white text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold transition-colors"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
