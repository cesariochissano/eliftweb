import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, ZoomControl, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const userIcon = L.divIcon({
    className: 'bg-transparent',
    html: `<div style="background-color: #10d772; width: 22px; height: 22px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.2);"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -10]
});

const carIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
});

const DEFAULT_CENTER: [number, number] = [-25.9692, 32.5732];

interface MapProps {
    userLocation?: { lat: number; lng: number } | null;
    pickupLocation?: { lat: number; lng: number } | null;
    destinationLocation?: { lat: number; lng: number } | null;
    driverLocation?: { lat: number; lng: number } | null;
    otherDrivers?: Array<{ id: string; lat: number; lng: number }>;
    onMapClick?: (lat: number, lng: number) => void;
    tripStatus?: string;
    isSimulatingArrival?: boolean;
}

function MapController({ routeStart, routeEnd, onMapClick, setRoute }: {
    routeStart?: { lat: number; lng: number } | null,
    routeEnd?: { lat: number; lng: number } | null,
    onMapClick?: (lat: number, lng: number) => void,
    setRoute: (route: [number, number][]) => void
}) {
    const map = useMap();

    useEffect(() => {
        if (routeStart && routeEnd) {
            const fetchRoute = async () => {
                try {
                    const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${routeStart.lng},${routeStart.lat};${routeEnd.lng},${routeEnd.lat}?overview=full&geometries=geojson`);
                    const data = await response.json();
                    if (data.routes && data.routes[0]) {
                        const coords = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
                        setRoute(coords);

                        const bounds = L.latLngBounds(coords);
                        map.fitBounds(bounds, {
                            paddingTopLeft: [50, 50],
                            paddingBottomRight: [50, 300],
                            animate: true,
                            duration: 1
                        });
                    }
                } catch (error) {
                    console.error('Routing error:', error);
                }
            };
            fetchRoute();
        } else if (routeStart && !routeEnd) {
            map.flyTo([routeStart.lat, routeStart.lng], 16, { animate: true });
            setRoute([]);
        }
    }, [routeStart?.lat, routeStart?.lng, routeEnd?.lat, routeEnd?.lng, map, setRoute]);

    useEffect(() => {
        if (routeStart && (routeStart === routeEnd || !routeEnd)) {
            map.panTo([routeStart.lat, routeStart.lng], { animate: true, duration: 0.5 });
        }
    }, [routeStart?.lat, routeStart?.lng, map]);

    useEffect(() => {
        if (onMapClick) {
            map.on('click', (e) => {
                onMapClick(e.latlng.lat, e.latlng.lng);
            });
            return () => {
                map.off('click');
            };
        }
    }, [onMapClick, map]);

    return null;
}

function Map({
    userLocation,
    pickupLocation,
    destinationLocation,
    driverLocation,
    otherDrivers = [],
    onMapClick,
    tripStatus,
    isSimulatingArrival
}: MapProps) {
    const [route, setRoute] = useState<[number, number][]>([]);
    const [animatedDriverPos, setAnimatedDriverPos] = useState<{ lat: number; lng: number } | null>(null);
    const animationFrameRef = useRef<number>();
    const startTimeRef = useRef<number>();

    const routeStart = useMemo(() => {
        let start = pickupLocation || userLocation;
        if (tripStatus === 'ACCEPTED' || tripStatus === 'IN_PROGRESS') {
            start = driverLocation || start;
        }
        return start;
    }, [userLocation, pickupLocation, driverLocation, tripStatus]);

    const routeEnd = useMemo(() => {
        if (tripStatus === 'ACCEPTED') return pickupLocation;
        if (tripStatus === 'IN_PROGRESS') return destinationLocation;
        return destinationLocation;
    }, [pickupLocation, destinationLocation, tripStatus]);

    // Animation Logic for Simulation
    useEffect(() => {
        if (isSimulatingArrival && route.length > 0) {
            startTimeRef.current = performance.now();
            const duration = 5000; // 5 seconds simulation

            const animate = (now: number) => {
                const elapsed = now - (startTimeRef.current || now);
                const progress = Math.min(elapsed / duration, 1);

                // We want the car to glide from ~80% of the route to 100% (pickup)
                const startProgress = 0.8;
                const actualProgress = startProgress + (progress * (1 - startProgress));

                const index = Math.floor(actualProgress * (route.length - 1));
                const nextIndex = Math.min(index + 1, route.length - 1);
                const ratio = (actualProgress * (route.length - 1)) - index;

                const currentPoint = route[index];
                const nextPoint = route[nextIndex];

                if (currentPoint && nextPoint) {
                    setAnimatedDriverPos({
                        lat: currentPoint[0] + (nextPoint[1] ? (nextPoint[0] - currentPoint[0]) * ratio : 0),
                        lng: currentPoint[1] + (nextPoint[1] ? (nextPoint[1] - currentPoint[1]) * ratio : 0)
                    });
                }

                if (progress < 1) {
                    animationFrameRef.current = requestAnimationFrame(animate);
                }
            };

            animationFrameRef.current = requestAnimationFrame(animate);
            return () => {
                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            };
        } else {
            setAnimatedDriverPos(null);
        }
    }, [isSimulatingArrival, route]);

    const initialCenter = useMemo(() => {
        return userLocation ? [userLocation.lat, userLocation.lng] as [number, number] : DEFAULT_CENTER;
    }, [userLocation]);

    return (
        <div className="w-full h-full absolute inset-0 z-0 bg-[#f8f9fa]">
            <MapContainer
                center={initialCenter}
                zoom={14}
                zoomControl={false}
                className="w-full h-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                <ZoomControl position="topright" />

                <MapController
                    routeStart={routeStart}
                    routeEnd={routeEnd}
                    onMapClick={onMapClick}
                    setRoute={setRoute}
                />

                {route.length > 0 && (
                    <Polyline
                        positions={route}
                        pathOptions={{
                            color: 'white',
                            weight: 8,
                            opacity: 1,
                            lineJoin: 'round',
                            lineCap: 'round'
                        }}
                    />
                )}

                {route.length > 0 && (
                    <Polyline
                        positions={route}
                        pathOptions={{
                            color: '#000000',
                            weight: 5,
                            opacity: 0.9,
                            lineJoin: 'round',
                            lineCap: 'round'
                        }}
                    />
                )}

                {(pickupLocation || (userLocation && !driverLocation)) && (
                    <Marker
                        position={[pickupLocation?.lat || userLocation!.lat, pickupLocation?.lng || userLocation!.lng]}
                        icon={userIcon}
                    />
                )}

                {destinationLocation && (
                    <Marker position={[destinationLocation.lat, destinationLocation.lng]} icon={L.icon({
                        iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                        iconSize: [35, 35],
                        iconAnchor: [17, 35]
                    })} />
                )}

                {(animatedDriverPos || driverLocation) && (
                    <Marker
                        position={[animatedDriverPos?.lat || driverLocation!.lat, animatedDriverPos?.lng || driverLocation!.lng]}
                        icon={carIcon}
                        zIndexOffset={1000}
                    />
                )}

                {(!tripStatus || tripStatus === 'IDLE' || tripStatus === 'REQUESTING') && otherDrivers
                    .filter(driver => {
                        if (userLocation) {
                            const isSamePos = Math.abs(driver.lat - userLocation.lat) < 0.00001 &&
                                Math.abs(driver.lng - userLocation.lng) < 0.00001;
                            if (isSamePos) return false;
                        }
                        return true;
                    })
                    .map(driver => (
                        <Marker
                            key={driver.id}
                            position={[driver.lat, driver.lng]}
                            icon={carIcon}
                            opacity={0.6}
                        />
                    ))}
            </MapContainer>

            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/90 to-transparent pointer-events-none z-[400]" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/90 to-transparent pointer-events-none z-[400]" />
        </div>
    );
}

export default React.memo(Map);
