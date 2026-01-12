import { useEffect } from 'react';

/**
 * Hook to handle browser back button (hardware back on Android).
 * @param onBack Function to call when back button is pressed. Return true if handled (prevent default), false to allow navigation.
 */
export const useBackHandler = (onBack: () => boolean) => {
    useEffect(() => {
        const handlePopState = () => {
            if (onBack()) {
                // If handled, push state back to prevent actual navigation away
                // This makes the back button act as a "close modal" button
                // confining the user to the current page state
                window.history.pushState(null, '', window.location.href);
            }
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [onBack]);
};
