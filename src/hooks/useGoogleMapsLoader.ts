import { useState, useEffect } from 'react';

const LIBRARIES: string[] = ['places', 'geometry'];

export function useGoogleMapsLoader() {
    const [isLoaded, setIsLoaded] = useState(false);
    const [loadError, setLoadError] = useState<Error | null>(null);

    useEffect(() => {
        if ((window as any).google?.maps) {
            setIsLoaded(true);
            return;
        }

        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            setLoadError(new Error("Google Maps API Key missing"));
            return;
        }

        const scriptId = 'google-maps-script';
        const existingScript = document.getElementById(scriptId);

        if (existingScript) {
            // Already loading or loaded
            existingScript.addEventListener('load', () => setIsLoaded(true));
            existingScript.addEventListener('error', () => setLoadError(new Error("Failed to load Google Maps script")));
            return;
        }

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${LIBRARIES.join(',')}`;
        script.async = true;
        script.defer = true;

        script.addEventListener('load', () => setIsLoaded(true));
        script.addEventListener('error', () => setLoadError(new Error("Failed to load Google Maps script")));

        document.head.appendChild(script);

        return () => {
            // cleanup if needed (usually we keep the script)
        };
    }, []);

    return { isLoaded, loadError };
}
