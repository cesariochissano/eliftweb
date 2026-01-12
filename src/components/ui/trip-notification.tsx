import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Car, MapPin, Bell } from 'lucide-react';

export type NotificationType = 'success' | 'info' | 'arrival' | 'default';

interface TripNotificationProps {
    message: string;
    subMessage?: string;
    type?: NotificationType;
    isVisible: boolean;
    onClose: () => void;
}

export const TripNotification: React.FC<TripNotificationProps> = ({
    message,
    subMessage,
    type = 'default',
    isVisible,
    onClose
}) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000); // Auto hide after 5s
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle2 className="text-white" size={24} />;
            case 'arrival': return <MapPin className="text-white" size={24} />;
            case 'info': return <Car className="text-white" size={24} />;
            default: return <Bell className="text-white" size={24} />;
        }
    };

    const getBgColor = () => {
        switch (type) {
            case 'success': return 'bg-[#10d772]'; // eLift Green
            case 'arrival': return 'bg-black';
            case 'info': return 'bg-blue-600';
            default: return 'bg-gray-900';
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="fixed top-safe left-4 right-4 z-[2000] pointer-events-none flex justify-center mt-2"
                >
                    <div className={`${getBgColor()} shadow-2xl rounded-2xl p-4 pr-6 flex items-center gap-4 min-w-[300px] pointer-events-auto`}>
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            {getIcon()}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-white font-bold text-sm leading-tight">{message}</h3>
                            {subMessage && <p className="text-white/80 text-xs mt-0.5 font-medium">{subMessage}</p>}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
