import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore
import { Logo } from '../ui/logo';
// @ts-ignore
import { useScrollDirection } from '../../hooks/useScrollDirection';

interface DynamicHeaderProps {
    userAvatar: string | null;
    onMenuClick: () => void;
    // We pass the scroll container Ref or use window? 
    // The previous analysis showed HomeDashboard uses a div overflow-y-auto.
    // So window scroll might NOT work if the body isn't scrolling.
    // We need to attach the scroll listener to the container.
    // Or, simpler: We make the HomeDashboard body scroll (remove overflow-y-auto from div and put it on page?).
    // Given the Phase 1 fixes, we likely have h-dvh and overflow-hidden on body. 
    // So we need to accept the scrollY from the parent or pass a ref.
    // Let's assume for now we will refactor HomeDashboard to pass scroll state or we attach to the specific element.
    // ACTUALLY: The best way for the "Facebook Style" in a PWA structure is to let the ScrollView drive the events.
    // Let's accept `scrollY` and `scrollDirection` as props if we can't hook into window.
    // But `useScrollDirection` hooks into window.
    // IF the scrolling happens in a DIV, `useScrollDirection` needs to accept a Ref. 
    // Let's update `useScrollDirection` to accept a target element later if needed.
    // For this step, I'll assume we'll fix the scroll container in HomeDashboard.
    currentScrollY: number;
    isScrollingDown: boolean;
}

export const DynamicHeader: React.FC<DynamicHeaderProps> = ({
    userAvatar,
    onMenuClick,
    currentScrollY,
    isScrollingDown
}) => {
    // Anchor-Relay Logic
    // Logo appears when we scroll past the greeting (approx 60-80px)
    const showLogo = currentScrollY > 60;

    // Glassmorphism Logic
    // Background becomes visible after a tiny bit of scroll
    const showBackground = currentScrollY > 10;

    // Hide Header Logic
    // Hide when scrolling DOWN AND we are deep in the page (>100px)
    // Show when scrolling UP or at TOPO
    const isHidden = isScrollingDown && currentScrollY > 100;

    return (
        <motion.header
            initial={{ y: 0 }}
            animate={{ y: isHidden ? -100 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`fixed top-0 left-0 right-0 z-[60] h-[safe-top-h] min-h-[64px] flex items-end pb-3 px-6 transition-colors duration-500
                ${showBackground ? 'bg-white/90 backdrop-blur-md border-b border-gray-100/50' : 'bg-transparent border-transparent'}
            `}
        >
            <div className="w-full flex items-center justify-between">
                {/* Logo Area (Left) */}
                <div className="h-8 flex items-center">
                    <AnimatePresence>
                        {showLogo && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="flex items-center gap-2"
                            >
                                <Logo className="h-6 w-auto" />
                                <span className="font-bold text-lg tracking-tight text-[#101b0d]">eLift</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Avatar Area (Right) - ALWAYS VISIBLE */}
                <button
                    onClick={onMenuClick}
                    className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/50 shadow-sm active:scale-95 transition-transform"
                >
                    {userAvatar ? (
                        <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-[10px] font-bold">IMG</span>
                        </div>
                    )}
                </button>
            </div>
        </motion.header>
    );
};
