import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, ZoomControl, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// New Component Integration
import VehicleMarker from './VehicleMarker';

// Import 3D Assets
import pinPickup from '../../assets/map/pin_pickup.png';

// --- ICONS SETUP ---

const passengerPinIcon = L.icon({
    iconUrl: pinPickup,
    iconSize: [48, 56],
    iconAnchor: [24, 56],
    popupAnchor: [0, -50],
    className: 'drop-shadow-xl' // Green (Original)
});

const destinationPinIcon = L.icon({
    iconUrl: pinPickup,
    iconSize: [48, 56],
    iconAnchor: [24, 56],
    popupAnchor: [0, -50],
    className: 'drop-shadow-xl hue-rotate-[140deg] brightness-90 saturate-150' // Shift Green -> Red
});

const DefaultIcon = L.icon({
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

// --- TYPES ---

interface MapProps {
    userLocation?: { lat: number; lng: number } | null;
    pickupLocation?: { lat: number; lng: number } | null;
    destinationLocation?: { lat: number; lng: number } | null;
    driverLocation?: { lat: number; lng: number } | null;
    otherDrivers?: Array<{ id: string; lat: number; lng: number }>;
    onMapClick?: (lat: number, lng: number) => void;
    tripStatus?: string;
    bottomPadding?: number;
}

// --- HOOKS ---

// Simple Physics Simulation Hook
const useTripSimulation = (
    route: [number, number][],
    isActive: boolean,
    durationMs: number = 90000 // 1.5 minutes
) => {
    const [simulatedPos, setSimulatedPos] = useState<[number, number] | null>(null);
    const [bearing, setBearing] = useState(0);
    const [currentRouteIndex, setCurrentRouteIndex] = useState(0);

    useEffect(() => {
        if (!isActive || route.length < 2) return;

        let startTime: number | null = null;
        let animationFrame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / durationMs, 1);

            // Simple Linear Interpolation along path (simplified: assuming equal segments for now)
            // Ideally should be distance-based, but for demo this is visual enough
            const totalPoints = route.length;
            const currentPointIndex = Math.min(Math.floor(progress * (totalPoints - 1)), totalPoints - 2);

            if (currentPointIndex >= 0) {
                const p1 = route[currentPointIndex];
                const p2 = route[currentPointIndex + 1];
                const segmentProgress = (progress * (totalPoints - 1)) - currentPointIndex;

                const lat = p1[0] + (p2[0] - p1[0]) * segmentProgress;
                const lng = p1[1] + (p2[1] - p1[1]) * segmentProgress;

                setSimulatedPos([lat, lng]);
                setCurrentRouteIndex(currentPointIndex);

                // Calculate simple bearing
                const angle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * 180 / Math.PI;
                setBearing((angle + 360) % 360); // Normalize
            }

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [isActive, route, durationMs]);

    return { simulatedPos, bearing, currentRouteIndex };
};

// --- SUB-COMPONENTS ---

function MapController({ routeStart, routeEnd, onMapClick, setRoute, bottomPadding = 50 }: {
    routeStart?: { lat: number; lng: number } | null,
    routeEnd?: { lat: number; lng: number } | null,
    onMapClick?: (lat: number, lng: number) => void,
    setRoute: (route: [number, number][]) => void,
    bottomPadding?: number
}) {
    const map = useMap();
    const [currentRouteBounds, setCurrentRouteBounds] = useState<L.LatLngBounds | null>(null);

    // Effect: Calculate Route & Initial Fit
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
                        setCurrentRouteBounds(bounds); // Save bounds for re-padding

                        map.fitBounds(bounds, {
                            paddingTopLeft: [50, 50],
                            paddingBottomRight: [50, 300], // Initial fallback
                            animate: true,
                            duration: 1
                        });
                    }
                } catch (error) {
                    console.error('Routing error:', error);
                }
            };
            fetchRoute();
        } else {
            setCurrentRouteBounds(null);
            // CHANGE: If missing points, DO NOT clear route here immediately to avoid flickering, 
            // but 'Map' component will handle cleanup via tripStatus check.
            // Actually, if routeEnd is explicitly null (e.g. cancelled), we should clear.
            if (routeEnd && routeEnd.lat && routeEnd.lng) {
                setRoute([]); // Clear if no destination
            }
            if (routeStart && routeStart.lat && routeStart.lng && !routeEnd) {
                map.flyTo([routeStart.lat, routeStart.lng], 16, { animate: true });
            }
        }
    }, [routeStart?.lat, routeStart?.lng, routeEnd?.lat, routeEnd?.lng, map, setRoute]);

    // Effect: Update Padding when prop changes
    useEffect(() => {
        if (currentRouteBounds) {
            map.fitBounds(currentRouteBounds, {
                paddingTopLeft: [50, 50],
                paddingBottomRight: [50, bottomPadding], // Dynamic Padding
                animate: true,
                duration: 0.8
            });
        }
    }, [bottomPadding, currentRouteBounds, map]);

    // ... (rest of controller unchanged)

    useMemo(() => {
        if (onMapClick) {
            map.on('click', (e) => {
                onMapClick(e.latlng.lat, e.latlng.lng);
            });
            return () => {
                map.off('click');
            };
        }
    }, [map, onMapClick]);

    return null;
}

// --- MAIN COMPONENT ---

export default function Map({ userLocation, pickupLocation, destinationLocation, driverLocation, otherDrivers, onMapClick, tripStatus, bottomPadding }: MapProps) {
    const [route, setRoute] = useState<[number, number][]>([]);

    // 1. Simulation Logic
    const isTripActive = tripStatus === 'IN_PROGRESS';
    const { simulatedPos, bearing: simulatedBearing, currentRouteIndex } = useTripSimulation(route, isTripActive);

    // 2. Clear Route on IDLE (Fix Ghost Routes)
    useEffect(() => {
        if (tripStatus === 'IDLE') {
            setRoute([]);
        }
    }, [tripStatus]);


    // Determines effective driver position: Real or Simulated
    const isPosValid = (pos: any): pos is [number, number] =>
        Array.isArray(pos) && typeof pos[0] === 'number' && typeof pos[1] === 'number' && !isNaN(pos[0]) && !isNaN(pos[1]);

    const effectiveDriverPos = isTripActive && isPosValid(simulatedPos) ? simulatedPos : (driverLocation && typeof driverLocation.lat === 'number' && typeof driverLocation.lng === 'number' ? [driverLocation.lat, driverLocation.lng] : null);
    const effectiveBearing = isTripActive ? simulatedBearing : 0; // todo: real bearing from props

    // Dynamic Route Clipping: Show only from current car position onwards
    const displayedRoute = isTripActive && simulatedPos
        ? [simulatedPos, ...route.slice(currentRouteIndex + 1)]
        : route;

    return (
        <div className="w-full h-full relative z-0">
            <MapContainer
                center={userLocation ? [userLocation.lat, userLocation.lng] : [-25.9692, 32.5732]}
                zoom={16}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                className="z-0"
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                <ZoomControl position="topright" />

                <MapController
                    routeStart={pickupLocation || userLocation}
                    routeEnd={destinationLocation}
                    onMapClick={onMapClick}
                    setRoute={setRoute}
                    bottomPadding={bottomPadding}
                />

                {/* Route Line (Black) */}
                {displayedRoute.length > 0 && (
                    <>
                        <Polyline
                            positions={displayedRoute}
                            color="#000000"
                            weight={5}
                            opacity={0.8}
                        />
                    </>
                )}

                {/* User Location */}
                {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} />
                )}

                {/* Pickup Marker (Hide when IN_PROGRESS) */}
                {pickupLocation && pickupLocation.lat && pickupLocation.lng && !isTripActive && (
                    <Marker position={[pickupLocation.lat, pickupLocation.lng]} icon={passengerPinIcon} />
                )}

                {/* Destination Marker */}
                {destinationLocation && destinationLocation.lat && destinationLocation.lng && (
                    <Marker position={[destinationLocation.lat, destinationLocation.lng]} icon={destinationPinIcon} />
                )}

                {/* --- 3D VEHICLE MARKERS --- */}

                {/* Main Driver (Simulated or Real) */}
                {effectiveDriverPos && effectiveDriverPos[0] && effectiveDriverPos[1] && (
                    <VehicleMarker
                        position={effectiveDriverPos as [number, number]}
                        bearing={effectiveBearing}
                    />
                )}

                {/* Other simulated drivers */}
                {otherDrivers?.filter(d => d.lat && d.lng).map(driver => (
                    <VehicleMarker
                        key={driver.id}
                        position={[driver.lat, driver.lng]}
                        bearing={Math.random() * 360}
                    />
                ))}

            </MapContainer>
        </div>
    );
}
