import { useState, useEffect } from 'react';
import type { PanInfo } from 'framer-motion';
import { motion, AnimatePresence, useAnimation, useDragControls } from 'framer-motion';

interface UnifiedBottomSheetProps {
    children: React.ReactNode;
    snapPoints: number[]; // Consistent usage: numbers > 1 are pixels, <= 1 are percentages.
    currentIndex?: number; // Controlled index
    onSnapChange?: (index: number) => void;
    isDismissible?: boolean;
    onDismiss?: () => void;
    Backdrop?: boolean;
    onBackdropClick?: () => void;
    className?: string;
    headerContent?: React.ReactNode;
}

export function UnifiedBottomSheet({
    children,
    snapPoints,
    currentIndex = 0,
    onSnapChange,
    isDismissible = false,
    onDismiss,
    Backdrop = false,
    onBackdropClick,
    className = '',
    headerContent
}: UnifiedBottomSheetProps) {
    const [height, setHeight] = useState(window.innerHeight);
    const controls = useAnimation();
    const dragControls = useDragControls();
    const [activeIndex, setActiveIndex] = useState(currentIndex);

    // Sync external control
    useEffect(() => {
        setActiveIndex(currentIndex);
    }, [currentIndex]);

    useEffect(() => {
        const h = window.innerHeight;
        setHeight(h);

        // Safety: Ensure index is within bounds of snapPoints
        const safeIndex = Math.min(activeIndex, snapPoints.length - 1);
        const targetPoint = snapPoints[safeIndex];

        if (targetPoint !== undefined) {
            const target = getSnapHeight(targetPoint, h);
            controls.start({ y: h - target });
        }
    }, [activeIndex, snapPoints, height, controls]);

    const getSnapHeight = (point: number, windowHeight: number) => {
        return point <= 1 ? point * windowHeight : point;
    };

    const handleDragEnd = (_: any, info: PanInfo) => {
        const { offset, velocity } = info;
        const currentY = height - getSnapHeight(snapPoints[activeIndex], height);
        const predictedY = currentY + offset.y + velocity.y * 20;

        let closestIndex = activeIndex;
        let minDiff = Infinity;

        snapPoints.forEach((point, index) => {
            const snapH = getSnapHeight(point, height);
            const snapY = height - snapH;
            const diff = Math.abs(snapY - predictedY);

            if (diff < minDiff) {
                minDiff = diff;
                closestIndex = index;
            }
        });

        if (isDismissible && predictedY > height * 0.9) {
            onDismiss?.();
            return;
        }

        setActiveIndex(closestIndex);
        onSnapChange?.(closestIndex);
    };

    const toggleSnap = () => {
        if (snapPoints.length < 2) return;
        const nextIndex = (activeIndex + 1) % snapPoints.length;
        setActiveIndex(nextIndex);
        onSnapChange?.(nextIndex);
    };

    const maxSnapHeight = Math.max(...snapPoints.map(p => getSnapHeight(p, height)));
    const minDragY = height - maxSnapHeight;

    return (
        <>
            <AnimatePresence>
                {Backdrop && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={onBackdropClick}
                        className="fixed inset-0 bg-black z-[900]"
                    />
                )}
            </AnimatePresence>

            <motion.div
                drag="y"
                dragControls={dragControls}
                dragListener={false} // ONLY drag via handle
                dragConstraints={{ top: minDragY, bottom: height }}
                dragElastic={0.05}
                dragMomentum={false}
                onDragEnd={handleDragEnd}
                animate={controls}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                initial={{ y: height }}
                className={`fixed left-0 right-0 bg-white rounded-t-[2.5rem] shadow-[0_-10px_60px_rgba(0,0,0,0.15)] z-[1000] overflow-hidden flex flex-col ${className}`}
                style={{ height: maxSnapHeight + 100 }}
            >
                {/* Handle / Header - Clickable & Draggable */}
                <motion.div
                    className="flex-shrink-0 w-full flex flex-col items-center pt-4 pb-2 bg-white z-10 cursor-grab active:cursor-grabbing"
                    onPointerDown={(e) => dragControls.start(e)}
                    onTap={toggleSnap}
                >
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full mb-2" />
                    {headerContent}
                </motion.div>

                {/* Content - Natural Scroll */}
                <div className="flex-1 overflow-y-auto relative overscroll-contain px-0 pb-20">
                    {children}
                </div>
            </motion.div>
        </>
    );
}
