import React, { useState, useRef } from 'react';
import { MapPin, CalendarClock } from 'lucide-react';
// import { Button } from '../ui/button';
import { ServiceGrid } from './ServiceGrid';
import { RecentActivityList } from './RecentActivityList';
import { motion } from 'framer-motion';
import { DynamicHeader } from './DynamicHeader';

interface HomeDashboardProps {
    userName: string;
    greeting: string;
    userAvatar: string | null;
    currentAddress: string;
    onMenuClick: () => void;
    onServiceSelect: (id: string) => void;
    onScheduleClick: () => void;
    onRequestClick: () => void;
    selectedService?: string; // New Prop for Dynamic CTA
}

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
    userName,
    userAvatar,
    currentAddress,
    greeting,
    onMenuClick,
    onServiceSelect,
    onScheduleClick,
    onRequestClick,
    selectedService = 'drive' // Default to drive
}) => {
    // Scroll Tracking for Dynamic Header
    const [scrollY, setScrollY] = useState(0);
    const [isScrollingDown, setIsScrollingDown] = useState(false);
    const lastScrollY = useRef(0);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const current = e.currentTarget.scrollTop;
        const diff = current - lastScrollY.current;

        // Hysteresis for direction
        if (Math.abs(diff) > 5) {
            setIsScrollingDown(diff > 0);
        }

        setScrollY(current);
        lastScrollY.current = current;
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col bg-gray-50 relative overflow-hidden h-full"
        >
            {/* Dynamic Header (Fixed Overlay) */}
            <DynamicHeader
                userAvatar={userAvatar}
                onMenuClick={onMenuClick}
                currentScrollY={scrollY}
                isScrollingDown={isScrollingDown}
            />

            {/* Scrollable Content */}
            <div
                className="flex-1 flex flex-col overflow-y-auto no-scrollbar pb-[120px] w-full pt-[safe-top-h] mt-16"
                onScroll={handleScroll}
            >
                <div className="w-full max-w-[1200px] mx-auto flex flex-col">

                    {/* HERO TITLE (Greeting moved here) - Semantic Anchor */}
                    <motion.div variants={itemVariants} className="px-6 mt-2 mb-6">
                        <span className="text-fluid-body text-gray-400 font-medium block mb-0.5">{greeting},</span>
                        <h1 className="font-bold text-[#101b0d] text-fluid-h1 leading-tight">
                            {userName}
                        </h1>
                    </motion.div>

                    {/* Dominant Banner Item */}
                    <motion.div variants={itemVariants} className="px-6 mb-8 mt-2">
                        <button
                            onClick={onRequestClick}
                            className="w-full h-[260px] pro:h-[340px] bg-[#101b0d] rounded-[2.5rem] relative overflow-hidden flex flex-col items-start justify-end p-8 shadow-2xl shadow-green-900/20 group active:scale-[0.98] transition-all"
                        >
                            {/* Background Gradients */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[#101b0d] via-[#0a1208] to-[#000000]" />

                            {/* Urban Flow Effect (Traffic Bokeh) */}
                            {[...Array(6)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{
                                        opacity: 0,
                                        y: '100%',
                                        x: `${Math.random() * 100}%`
                                    }}
                                    animate={{
                                        opacity: [0, 0.4, 0],
                                        y: ['100%', '-20%']
                                    }}
                                    transition={{
                                        duration: Math.random() * 5 + 5, // 5-10s slow flow
                                        repeat: Infinity,
                                        delay: Math.random() * 5,
                                        ease: "linear"
                                    }}
                                    className="absolute w-24 h-24 rounded-full blur-[40px]"
                                    style={{
                                        background: i % 2 === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(16, 215, 114, 0.15)', // White & Green mix
                                        width: Math.random() * 100 + 50 + 'px', // Random size
                                    }}
                                />
                            ))}

                            {/* Breathing Glow (Existing) */}
                            <motion.div
                                animate={{ opacity: [0.2, 0.3, 0.2] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-0 right-0 w-64 h-64 bg-[#10D772] rounded-full blur-[100px]"
                            />

                            {/* Glimmer Effect (Diagonal Shine) */}
                            <motion.div
                                initial={{ x: '-150%', opacity: 0 }}
                                animate={{ x: '150%', opacity: [0, 0.3, 0] }}
                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
                                className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-30deg]"
                            />

                            {/* Abstract Map Lines Decor */}
                            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/city-fields.png')] mix-blend-overlay" />

                            {/* Content */}
                            <div className="relative z-10 w-full text-left">
                                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-4 border border-white/5">
                                    <div className="w-2 h-2 bg-[#10d772] rounded-full animate-pulse" />
                                    <span className="text-xs font-medium text-white/90 truncate max-w-[200px]">
                                        {currentAddress.split(',')[0]}
                                    </span>
                                </div>

                                <div className="flex items-end justify-between w-full">
                                    <h2 className="text-white text-fluid-h2 pro:text-fluid-h1 font-bold leading-[1.1] max-w-[calc(100%-80px)]">
                                        Encontre o seu <br className="block md:hidden" />
                                        <span className="text-[#10d772]">melhor trajeto.</span>
                                    </h2>

                                    <div className="w-12 h-12 pro:w-16 pro:h-16 bg-white rounded-full flex items-center justify-center shadow-lg shadow-white/10">
                                        <MapPin className="text-[#101b0d] w-[50%] h-[50%] fill-current" />
                                    </div>
                                </div>
                            </div>
                        </button>
                    </motion.div>

                    {/* Service Grid - Staggered Row 1 */}
                    <motion.div variants={itemVariants} className="px-6 mb-8">
                        <ServiceGrid onSelectService={onServiceSelect} selectedService={selectedService} />
                    </motion.div>

                    {/* Recent Activity - Staggered Row 2 */}
                    <motion.div variants={itemVariants} className="px-6 pb-24">
                        <RecentActivityList />
                    </motion.div>
                </div>
            </div>

            {/* Action Bar (New "Action Sheet" Entry) */}
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="absolute bottom-6 left-4 right-4 z-50 flex gap-3 max-w-[1200px] mx-auto"
            >
                {/* Schedule Button (Compact - Secondary Left) */}
                <button
                    onClick={onScheduleClick}
                    className="w-14 h-14 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex items-center justify-center active:scale-90 transition-all border border-gray-100/50"
                >
                    <CalendarClock className="w-6 h-6 text-gray-900" />
                </button>

                {/* Search Trigger (Primary Right - Green Spark) */}
                <button
                    onClick={onRequestClick}
                    className="flex-1 bg-white rounded-2xl shadow-[0_8px_30px_rgba(16,215,114,0.1)] h-14 px-5 flex items-center gap-4 active:scale-[0.98] transition-all border-2 border-[#10d772]"
                >
                    <div className="w-3 h-3 bg-[#10d772] rounded shrink-0 shadow-sm" />
                    <span className="text-[17px] font-semibold text-gray-700 truncate text-left w-full">Para onde vamos?</span>
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        <div className="w-4 h-4 text-gray-400 border-2 border-current border-t-transparent rounded-full opacity-0" /> {/* Placeholder for spinner if needed */}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900 w-4 h-4"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                </button>
            </motion.div>
        </motion.div>
    );
};
