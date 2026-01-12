import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface NewServiceCardProps {
    title: string;
    icon?: LucideIcon;
    imageSrc?: string; // Add support for image assets
    onClick: () => void;
    selected: boolean;
    className?: string; // Add className prop
}

export const NewServiceCard: React.FC<NewServiceCardProps> = ({ title, icon: Icon, imageSrc, onClick, selected, className }) => {
    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`
                h-[120px] rounded-[1.5rem] p-3 flex flex-col items-center justify-center gap-2 relative overflow-hidden transition-all shadow-sm
                ${selected ? 'bg-white border-2 border-green-500' : 'bg-white border border-transparent'} 
                ${className || 'w-full'}
            `}
        >
            {/* Image or Icon */}
            <div className="w-16 h-12 flex items-center justify-center mb-1 relative z-10">
                {imageSrc ? (
                    <img src={imageSrc} alt={title} className="w-full h-full object-contain drop-shadow-md" />
                ) : (
                    Icon && <Icon size={32} className="text-[#101b0d]" />
                )}
            </div>

            {/* Title */}
            <h3 className="font-bold text-sm text-[#101b0d] leading-none z-10">{title}</h3>

            {/* Selection Indicator */}
            {selected && (
                <div className="absolute top-3 right-3 w-3 h-3 bg-green-500 rounded-full" />
            )}
        </motion.button>
    );
};
