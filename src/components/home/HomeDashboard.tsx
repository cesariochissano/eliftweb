import React from 'react';
import { MapPin, CalendarClock } from 'lucide-react';
import { Button } from '../ui/button';
import { ServiceGrid } from './ServiceGrid';
import { RecentActivityList } from './RecentActivityList';

interface HomeDashboardProps {
    userName: string;
    greeting: string;
    userAvatar: string | null;
    currentAddress: string;
    onMenuClick: () => void;
    onServiceSelect: (id: string) => void;
    onScheduleClick: () => void;
    onRequestClick: () => void; // Redundant primary action usually maps to 'drive' or generic search
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
    userName,
    userAvatar,
    currentAddress,
    onMenuClick,
    onServiceSelect,
    onScheduleClick,
    onRequestClick
}) => {
    return (
        <div className="w-full h-screen flex flex-col bg-white overflow-hidden">
            {/* Scrollable Content Zone */}
            <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar pb-safe w-full">
                <div className="w-full max-w-[1200px] mx-auto flex flex-col">
                    {/* 1. Header & Greeting */}
                    <header className="px-6 flex items-center justify-between mt-[max(1rem,env(safe-area-inset-top))] mb-2 h-[clamp(56px,8vh,72px)] shrink-0">
                        <h1 className="text-[clamp(1.5rem,4vw,1.75rem)] font-extrabold text-[#101b0d] tracking-tight">
                            Olá, <span className="capitalize">{userName ? userName.split(' ')[0] : 'Newton'}</span>
                        </h1>
                        <div
                            className="w-[clamp(36px,6vw,48px)] h-[clamp(36px,6vw,48px)] rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0"
                            onClick={onMenuClick}
                        >
                            {userAvatar ? (
                                <img src={userAvatar || undefined} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop" alt="Profile" className="w-full h-full object-cover" />
                            )}
                        </div>
                    </header>

                    {/* 2. Dominant Banner (Visual Entry Point) */}
                    <div className="px-6 mb-4 mt-2 shrink-0">
                        <button
                            onClick={onRequestClick}
                            className="w-full h-[clamp(180px,32vh,300px)] bg-[#101b0d] rounded-[2.5rem] relative overflow-hidden flex flex-col items-start justify-end p-8 shadow-2xl shadow-green-900/20 group active:scale-[0.98] transition-all"
                        >
                            {/* Background Gradients */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[#101b0d] via-[#0a1208] to-[#000000]" />
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#10D772] rounded-full blur-[100px] opacity-20 group-hover:opacity-30 transition-opacity" />

                            {/* Abstract Map Lines Decor */}
                            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/city-fields.png')] mix-blend-overlay" />

                            {/* Content */}
                            <div className="relative z-10 w-full max-w-[70%]">
                                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-4 border border-white/10">
                                    <div className="w-2 h-2 rounded-full bg-[#10D772] animate-pulse" />
                                    <span className="text-white/90 text-xs font-bold tracking-wide truncate max-w-[20ch]">
                                        {currentAddress ? currentAddress.split(',')[0] : 'Para onde vamos?'}
                                    </span>
                                </div>

                                <h2 className="text-[clamp(1.5rem,4vw,2.25rem)] font-extrabold text-white leading-tight mb-1 text-left">
                                    Encontre o seu <br />
                                    <span className="text-[#10D772]">melhor trajeto.</span>
                                </h2>
                            </div>

                            {/* Floating Action Button (Relative to Banner) */}
                            <div className="absolute bottom-8 right-8 w-[clamp(32px,6vw,48px)] h-[clamp(32px,6vw,48px)] bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <MapPin size={24} className="text-[#101b0d] fill-current w-[50%] h-[50%]" />
                            </div>
                        </button>
                    </div>

                    {/* 3. Service Grid (3 Cols) */}
                    <div className="px-6 mb-4 shrink-0">
                        <ServiceGrid onSelectService={onServiceSelect} />
                    </div>

                    {/* 4. Recent Activity List */}
                    <div className="px-6 shrink-0">
                        <RecentActivityList />
                    </div>
                </div>
            </div>

            {/* 5. Fixed Flex Footer (Stable Action Zone) */}
            <div className="flex-shrink-0 bg-white border-t border-gray-50 pb-[env(safe-area-inset-bottom)] z-50">
                <div className="w-full max-w-[1200px] mx-auto px-6 py-4 flex gap-3">
                    <Button
                        variant="outline"
                        className="flex-1 h-[56px] rounded-[1.5rem] border-2 border-[#101b0d] hover:bg-[#101b0d] hover:text-white font-bold text-sm text-[#101b0d] transition-all"
                        onClick={onScheduleClick}
                    >
                        <CalendarClock size={20} className="mr-2" />
                        Agendar
                    </Button>
                    <Button
                        className="flex-[1.5] h-[56px] rounded-[1.5rem] bg-[#101b0d] hover:bg-black/90 text-white font-extrabold text-sm shadow-xl shadow-green-900/10"
                        onClick={() => {
                            onServiceSelect('drive'); // Default to drive
                            onRequestClick();
                        }}
                    >
                        <div className="w-2 h-2 rounded-full bg-[#10d772] mr-2 animate-pulse" />
                        Pedir Agora
                    </Button>
                </div>
            </div>
        </div>
    );
};
