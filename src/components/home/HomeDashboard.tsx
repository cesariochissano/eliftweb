import React from 'react';
import { User, Menu, MapPin, CalendarClock, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { ServiceGrid } from './ServiceGrid';
import { motion } from 'framer-motion';

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
    greeting,
    userAvatar,
    currentAddress,
    onMenuClick,
    onServiceSelect,
    onScheduleClick,
    onRequestClick
}) => {
    return (
        <div className="w-full h-full flex flex-col bg-gray-50/95 backdrop-blur-sm relative z-[1000]">

            {/* 1. Header (~9%) */}
            <header className="h-[9%] px-4 flex items-center justify-between pt-safe">
                <Button variant="ghost" size="icon" className="rounded-full" onClick={onMenuClick}>
                    <Menu size={24} className="text-[#101b0d]" />
                </Button>
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-white shadow-sm" onClick={onMenuClick}>
                    {userAvatar ? (
                        <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <User size={20} className="text-gray-500 m-auto mt-2.5" />
                    )}
                </div>
            </header>

            {/* 2. Greeting Zone (~6%) */}
            <div className="h-[6%] px-6 flex flex-col justify-center">
                <h1 className="text-lg font-bold text-[#101b0d] leading-tight">
                    {greeting}, <span className="capitalize">{userName || 'Passageiro'}</span>
                </h1>
                <p className="text-xs text-gray-500 font-medium">Para onde vamos?</p>
            </div>

            {/* 3. Context Zone (~12%) - Mini Map Static */}
            <div className="h-[12%] px-4 py-1">
                <div className="w-full h-full rounded-[1.2rem] bg-white border border-gray-100 shadow-sm overflow-hidden relative flex items-center px-4 gap-3">
                    {/* Fake Map Background */}
                    <div className="absolute inset-0 bg-gray-200 opacity-50 bg-[url('https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/14/9764/9876.png')] bg-cover bg-center grayscale contrast-50 opacity-30 blur-[1px]" />

                    {/* Icon */}
                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center shrink-0 z-10 shadow-lg">
                        <MapPin size={16} className="text-[#10d772]" />
                    </div>

                    {/* Text */}
                    <div className="z-10 flex-1 min-w-0">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Localização Atual</p>
                        <p className="text-xs font-bold text-[#101b0d] truncate leading-tight mt-0.5">
                            {currentAddress || 'Maputo, Moçambique'}
                        </p>
                    </div>

                    <ChevronRight size={16} className="text-gray-400 z-10" />
                </div>
            </div>

            {/* 4. Service Grid Zone (~45%) */}
            <div className="h-[45%]">
                <ServiceGrid onSelectService={onServiceSelect} />
            </div>

            {/* 5. Actions Zone (~10%) */}
            <div className="flex-1 px-4 flex items-center justify-between gap-3 pb-safe">
                <Button
                    className="flex-1 h-14 bg-black hover:bg-black/90 text-white rounded-[1rem] font-bold text-sm shadow-lg shadow-black/20"
                    onClick={onRequestClick}
                >
                    Pedir Lift agora
                </Button>
                <Button
                    variant="outline"
                    className="h-14 w-14 rounded-[1rem] border-gray-200 bg-white hover:bg-gray-50 shadow-sm flex flex-col items-center justify-center gap-0.5"
                    onClick={onScheduleClick}
                >
                    <CalendarClock size={20} className="text-gray-900" />
                </Button>
            </div>
        </div>
    );
};
