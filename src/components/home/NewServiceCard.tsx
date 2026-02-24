import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface NewServiceCardProps {
    title: string;
    icon?: LucideIcon;
    imageSrc?: string;
    onClick: () => void;
    selected: boolean;
    className?: string;
    badgeText?: string;
}

export const NewServiceCard: React.FC<NewServiceCardProps> = ({ title, icon: Icon, imageSrc, onClick, selected, className, badgeText }) => {
    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`
                rounded-3xl p-4 flex flex-col items-center justify-center gap-2 relative overflow-hidden transition-all shadow-sm
                ${selected
                    ? 'bg-white ring-2 ring-[#10d772] shadow-[0_4px_20px_rgba(16,215,114,0.15)]'
                    : 'bg-white border border-gray-100 hover:border-[#10d772]/30'}
                ${className || 'w-full h-[120px]'}
            `}
        >
            {/* Optional Badge */}
            {badgeText && (
                <div className="absolute top-0 left-0 bg-[#10d772] px-3 py-1 rounded-br-2xl z-20">
                    <span className="text-[10px] font-extrabold text-white tracking-wider uppercase">
                        {badgeText}
                    </span>
                </div>
            )}

            {/* Image or Icon - STRICT 70% Height Limit */}
            <div className="flex-1 flex items-center justify-center w-full relative z-10 h-full overflow-hidden">
                {imageSrc ? (
                    <img src={imageSrc} alt={title} className="w-auto h-[70%] object-contain drop-shadow-md" />
                ) : (
                    Icon && <Icon size={32} className="text-[#101b0d]" />
                )}
            </div>

            {/* Title */}
            <h3 className="font-bold text-sm text-[#101b0d] leading-none z-10 mt-1">{title}</h3>

            {/* Selection Indicator */}
            {selected && (
                <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-[#10d772] rounded-full shadow-sm" />
            )}

            {/* Active Background Pattern (Optional subtle detail) */}
            {selected && (
                <div className="absolute inset-0 bg-[#E8F5E9]/30 -z-0" />
            )}
        </motion.button>
    );
};
