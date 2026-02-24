import { useState, useEffect } from 'react';

export function useScrollDirection() {
    const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        let lastScrollY = window.scrollY;

        const updateScrollDirection = () => {
            const scrollY = window.scrollY;
            const direction = scrollY > lastScrollY ? 'down' : 'up';

            // Hysteresis: Only update direction if diff > 10px or at the very top
            if (direction !== scrollDirection && (Math.abs(scrollY - lastScrollY) > 10 || scrollY < 10)) {
                setScrollDirection(direction);
            }

            setScrollY(scrollY);
            lastScrollY = scrollY > 0 ? scrollY : 0;
        };

        // Use passive listener for performance
        window.addEventListener('scroll', updateScrollDirection, { passive: true });
        return () => {
            window.removeEventListener('scroll', updateScrollDirection);
        };
    }, [scrollDirection]);

    return { scrollDirection, scrollY };
}
