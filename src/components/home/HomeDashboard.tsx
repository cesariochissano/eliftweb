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
        <div className="w-full h-full flex flex-col bg-white relative overflow-hidden">
            <div className="flex-1 flex flex-col overflow-y-auto pb-24 no-scrollbar">
                {/* 1. Header & Greeting */}
                <header className="px-6 flex items-center justify-between pt-safe mt-4 mb-2">
                    <h1 className="text-3xl font-extrabold text-[#101b0d] tracking-tight">
                        Olá, <span className="capitalize">{userName ? userName.split(' ')[0] : 'Newton'}</span>
                    </h1>
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm" onClick={onMenuClick}>
                        {userAvatar ? (
                            <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop" alt="Profile" className="w-full h-full object-cover" />
                        )}
                    </div>
                </header>

                {/* 2. Map Banner / "Para onde vamos?" */}
                <div className="px-6 mb-6">
                    <button
                        onClick={onRequestClick}
                        className="w-full aspect-[2/1] bg-gray-100 rounded-[1.8rem] relative overflow-hidden flex flex-col items-start justify-center p-6 shadow-sm group active:scale-[0.98] transition-all"
                    >
                        {/* Map Background */}
                        <div className="absolute inset-0 bg-[url('https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/14/9764/9876.png')] bg-cover bg-center grayscale opacity-60 mix-blend-multiply" />

                        {/* 3D Map Pin Decor */}
                        <div className="absolute right-12 top-1/2 -translate-y-1/2">
                            <div className="relative">
                                <div className="w-4 h-4 bg-green-500 rounded-full animate-ping absolute top-0 left-1/2 -translate-x-1/2 opacity-20" />
                                <MapPin size={48} className="text-[#10D772] fill-current drop-shadow-xl" />
                                <div className="w-12 h-12 bg-green-500/20 blur-xl rounded-full absolute top-8 left-0" />
                            </div>
                        </div>

                        <div className="relative z-10 bg-white/80 backdrop-blur-md px-4 py-3 rounded-2xl shadow-sm border border-white/50">
                            <h2 className="text-lg font-bold text-[#101b0d]">Para onde vamos?</h2>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5 max-w-[150px] truncate">
                                {currentAddress || 'Localizando...'}
                            </p>
                        </div>
                    </button>
                </div>

                {/* 3. Service Grid (3 Cols) */}
                <div className="px-6 mb-4">
                    <ServiceGrid onSelectService={onServiceSelect} />
                </div>

                {/* 4. Recent Activity List */}
                <div className="px-6">
                    <RecentActivityList />
                </div>

                {/* Spacer for Fixed Footer */}
                <div className="h-4" />
            </div>

            {/* 5. Fixed Footer Actions */}
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-50 p-6 pb-safe pt-4 flex gap-3 z-[1000] shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
                <Button
                    variant="outline"
                    className="flex-1 h-14 rounded-[1.5rem] border-2 border-[#101b0d] hover:bg-[#101b0d] hover:text-white font-bold text-sm text-[#101b0d] transition-all"
                    onClick={onScheduleClick}
                >
                    <CalendarClock size={20} className="mr-2" />
                    Agendar Lift
                </Button>
                <Button
                    className="flex-[1.5] h-14 rounded-[1.5rem] bg-[#101b0d] hover:bg-black/90 text-white font-extrabold text-sm shadow-xl shadow-green-900/10"
                    onClick={() => {
                        onServiceSelect('drive'); // Default to drive
                        onRequestClick();
                    }}
                >
                    <div className="w-2 h-2 rounded-full bg-[#10d772] mr-2 animate-pulse" />
                    Pedir Lift Agora
                </Button>
            </div>
        </div>
    );
};
