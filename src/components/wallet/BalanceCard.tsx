import { useState } from 'react';
import { Eye, EyeOff, Plus, Wallet as WalletIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface BalanceCardProps {
    balance: number;
    currency?: string;
    onTopUpClick: () => void;
    isLoading?: boolean;
}

export const BalanceCard = ({ balance, currency = "MT", onTopUpClick, isLoading = false }: BalanceCardProps) => {
    const [isVisible, setIsVisible] = useState(true);

    return (
        <div className="w-full relative overflow-hidden rounded-[2rem] bg-[#101b0d] p-6 lg:p-8 shadow-2xl shadow-green-900/20 text-white min-h-[220px] flex flex-col justify-between group">

            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#10D772] rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-600 rounded-full blur-[80px] opacity-10 translate-y-1/3 -translate-x-1/3 pointer-events-none" />

            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay pointer-events-none" />

            {/* Top Row: Label + Visibility Toggle */}
            <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
                    <WalletIcon size={14} className="text-[#10D772]" />
                    <span className="text-xs font-bold tracking-wider uppercase text-white/90">Lift Wallet</span>
                </div>

                <button
                    onClick={() => setIsVisible(!isVisible)}
                    className="p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-gray-400 hover:text-white"
                >
                    {isVisible ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
            </div>

            {/* Middle: Check Balance */}
            <div className="relative z-10 mt-4">
                <span className="text-sm text-gray-400 block mb-1">Saldo Disponível</span>

                {isLoading ? (
                    <div className="h-12 w-48 bg-white/10 animate-pulse rounded-lg" />
                ) : (
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl lg:text-5xl font-bold tracking-tight">
                            {isVisible ? balance.toLocaleString('pt-MZ', { minimumFractionDigits: 2 }) : '••••••'}
                        </span>
                        <span className="text-lg lg:text-xl font-medium text-[#10D772] translate-y-[-4px]">
                            {currency}
                        </span>
                    </div>
                )}
            </div>

            {/* Bottom: Action Button */}
            <div className="relative z-10 mt-6 flex justify-end">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onTopUpClick}
                    className="flex items-center gap-2 bg-[#10D772] hover:bg-[#0eb560] text-[#0a1208] px-6 py-3 rounded-xl font-bold shadow-lg shadow-green-500/20 transition-colors"
                >
                    <div className="bg-black/10 rounded-full p-1">
                        <Plus size={16} strokeWidth={3} />
                    </div>
                    <span>Carregar</span>
                </motion.button>
            </div>
        </div>
    );
};
