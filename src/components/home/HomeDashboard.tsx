import React from 'react';
import { CalendarClock } from 'lucide-react';
import { Button } from '../ui/button';
import { ServiceGrid } from './ServiceGrid';
import { RecentActivityList } from './RecentActivityList';

// Assets
import mapBg from '../../assets/map_bg_minimal.png';
import pin3d from '../../assets/pin_3d.png';

interface HomeDashboardProps {
    userName: string;
    greeting: string;
    userAvatar: string | null;
    currentAddress: string;
    onMenuClick: () => void;
    onServiceSelect: (id: string) => void;
    onScheduleClick: () => void;
    onRequestClick: () => void;
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
            <div className="flex-1 flex flex-col overflow-y-auto pb-32 no-scrollbar">
                {/* 1. Header & Greeting */}
                <header className="px-6 flex items-center justify-between pt-safe mt-4 mb-2">
                    <h1 className="text-3xl font-extrabold text-[#101b0d] tracking-tight">
                        Olá, <span className="capitalize">{userName ? userName.split(' ')[0] : 'Newton'}</span>
                    </h1>
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm cursor-pointer" onClick={onMenuClick}>
                        {userAvatar ? (
                            <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop" alt="Profile" className="w-full h-full object-cover" />
                        )}
                    </div>
                </header>

                {/* 2. Map Banner / "Para onde vamos?" - PREMIUM REDESIGN */}
                <div className="px-6 mb-6">
                    <button
                        onClick={onRequestClick}
                        className="w-full aspect-[2/1] rounded-[2.5rem] relative overflow-hidden flex flex-col items-start justify-center p-8 shadow-lg group active:scale-[0.98] transition-all border border-gray-100"
                    >
                        {/* High Quality Map Background */}
                        <div className="absolute inset-0">
                            <img src={mapBg} alt="Map Background" className="w-full h-full object-cover opacity-90" />
                            {/* Gradient Overlay for Text Readability */}
                            <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/50 to-transparent" />
                        </div>

                        {/* 3D Map Pin - Floating Right */}
                        <div className="absolute -right-4 top-1/2 -translate-y-1/2">
                            <img
                                src={pin3d}
                                alt="Location Pin"
                                className="w-40 h-40 object-contain drop-shadow-2xl animate-float"
                                style={{ filter: 'drop-shadow(0px 10px 20px rgba(16, 215, 114, 0.3))' }}
                            />
                        </div>

                        {/* Text Content */}
                        <div className="relative z-10 max-w-[60%]">
                            <h2 className="text-2xl font-black text-[#101b0d] leading-tight mb-2">Para onde<br />vamos?</h2>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider truncate">
                                    {currentAddress || 'Localizando...'}
                                </p>
                            </div>
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
            </div>

            {/* 5. Floating Footer Actions (Safe Area Respect) */}
            <div className="fixed bottom-6 left-6 right-6 z-[1000] flex gap-3 pointer-events-none">
                {/* Container Interativo */}
                <div className="w-full flex gap-3 pointer-events-auto">
                    <Button
                        variant="outline"
                        className="flex-1 h-16 rounded-[2rem] bg-white/90 backdrop-blur-md border border-gray-100 shadow-xl hover:bg-gray-50 text-[#101b0d] font-bold text-sm transition-all"
                        onClick={onScheduleClick}
                    >
                        <CalendarClock size={20} className="mr-2" />
                        Agendar
                    </Button>
                    <Button
                        className="flex-[1.8] h-16 rounded-[2rem] bg-[#101b0d] hover:bg-black text-white font-extrabold text-sm shadow-2xl shadow-green-900/20 transition-all active:scale-95"
                        onClick={() => {
                            onServiceSelect('drive');
                            onRequestClick();
                        }}
                    >
                        <div className="w-2 h-2 rounded-full bg-[#10d772] mr-3 animate-pulse shadow-[0_0_10px_#10d772]" />
                        Pedir Lift Agora
                    </Button>
                </div>
            </div>

            {/* Safe Area Spacer included in padding-bottom of container */}
        </div>
    );
};
