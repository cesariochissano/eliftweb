import { useState, useEffect, useRef } from 'react';

export interface GeolocationState {
    latitude: number | null;
    longitude: number | null;
    speed: number | null; // in m/s
    error: string | null;
    loading: boolean;
}

export const useGeolocation = (enableTracking = false) => {
    const [state, setState] = useState<GeolocationState>({
        latitude: null,
        longitude: null,
        speed: null,
        error: null,
        loading: true,
    });

    const watchId = useRef<number | null>(null);

    useEffect(() => {
        if (!navigator.geolocation) {
            setState(s => ({ ...s, error: 'Geolocalização não suportada', loading: false }));
            return;
        }

        const onSuccess = (position: GeolocationPosition) => {
            setState({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                speed: position.coords.speed,
                error: null,
                loading: false,
            });
        };

        const onError = (error: GeolocationPositionError) => {
            setState(s => ({ ...s, error: error.message, loading: false }));
        };

        if (enableTracking) {
            // Watch position
            watchId.current = navigator.geolocation.watchPosition(onSuccess, onError, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            });
        } else {
            // Get current position once
            navigator.geolocation.getCurrentPosition(onSuccess, onError, {
                enableHighAccuracy: true,
            });
        }

        return () => {
            if (watchId.current !== null) {
                navigator.geolocation.clearWatch(watchId.current);
            }
        };
    }, [enableTracking]);

    return state;
};
