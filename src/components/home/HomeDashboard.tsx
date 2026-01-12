import React from 'react';
import { MapPin, CalendarClock } from 'lucide-react';
import { Button } from '../ui/button';
import { ServiceGrid } from './ServiceGrid';
import { RecentActivityList } from './RecentActivityList';
import { motion, AnimatePresence } from 'framer-motion';

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

    // Dynamic CTA Text Helper
    const getCtaText = (service: string) => {
        const map: Record<string, string> = {
            'drive': 'Pedir Carro',
            'bike': 'Pedir Bike',
            'txopela': 'Pedir Txopela',
            'carga': 'Pedir Carga'
        };
        return map[service] || 'Pedir Agora';
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="h-[100dvh] flex flex-col bg-gray-50 relative overflow-hidden"
        >
            {/* Scrollable Content - Added massive padding bottom to clear fixed footer */}
            <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar pb-[120px] w-full">
                <div className="w-full max-w-[1200px] mx-auto flex flex-col">

                    {/* Header Item */}
                    <motion.div variants={itemVariants} className="px-6 flex items-center justify-between mt-[max(1rem,env(safe-area-inset-top))] h-[clamp(56px,8vh,72px)] shrink-0 z-20">
                        <div className="flex flex-col">
                            <span className="text-sm text-gray-500 font-medium">{greeting},</span>
                            <h1 className="font-bold text-[#101b0d] text-[clamp(1.5rem,4vw,1.75rem)] leading-tight">
                                {userName}
                            </h1>
                        </div>
                        <button
                            onClick={onMenuClick}
                            className="relative w-[clamp(36px,6vw,48px)] h-[clamp(36px,6vw,48px)] rounded-full overflow-hidden border-2 border-white shadow-sm active:scale-95 transition-transform"
                        >
                            {userAvatar ? (
                                <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-400 text-xs">IMG</span>
                                </div>
                            )}
                        </button>
                    </motion.div>

                    {/* Dominant Banner Item */}
                    <motion.div variants={itemVariants} className="px-6 mb-8 mt-2">
                        <button
                            onClick={onRequestClick}
                            className="w-full h-[clamp(180px,32vh,300px)] bg-[#101b0d] rounded-[2.5rem] relative overflow-hidden flex flex-col items-start justify-end p-8 shadow-2xl shadow-green-900/20 group active:scale-[0.98] transition-all"
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
                                    <h2 className="text-white text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-[1.1] max-w-[calc(100%-80px)]">
                                        Encontre o seu <br />
                                        <span className="text-[#10d772]">melhor trajeto.</span>
                                    </h2>

                                    <div className="w-[clamp(48px,12vw,64px)] h-[clamp(48px,12vw,64px)] bg-white rounded-full flex items-center justify-center shadow-lg shadow-white/10">
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

            {/* Action Zone (Fixed Footer) */}
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-5px_20px_rgba(0,0,0,0.03)] z-50"
            >
                <div className="max-w-[1200px] mx-auto flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={onScheduleClick}
                        className="flex-1 h-[56px] rounded-2xl border-gray-200 text-gray-600 font-bold text-base hover:bg-gray-50 active:scale-95 transition-all"
                    >
                        <CalendarClock className="mr-2 h-5 w-5" />
                        Agendar
                    </Button>
                    <Button
                        size="lg"
                        onClick={onRequestClick}
                        className="flex-[2] h-[56px] rounded-2xl bg-[#101b0d] hover:bg-[#1a2c16] text-white font-bold text-lg shadow-lg shadow-green-900/10 active:scale-95 transition-all"
                    >
                        <div className="w-2 h-2 bg-[#10d772] rounded-full mr-3 animate-pulse" />

                        <AnimatePresence mode='wait'>
                            <motion.span
                                key={selectedService}
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -10, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {getCtaText(selectedService)}
                            </motion.span>
                        </AnimatePresence>
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
};
