import React, { useEffect, useState, useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Define the icon using the user-provided asset path (simulated for now, would be a real URL in prod)
// For this test, I will assume the image is available at /assets/vehicles/lift_drive_v1.png
// The user just uploaded it, so I will conceptually map it there.

interface VehicleMarkerProps {
    position: [number, number]; // [lat, lng]
    bearing: number;           // 0-360 degrees
    previousPosition?: [number, number];
}

const VehicleMarker: React.FC<VehicleMarkerProps> = ({ position, bearing }) => {
    const markerRef = useRef<L.Marker>(null);
    const [currentPos, setCurrentPos] = useState(position);
    const [currentBearing, setCurrentBearing] = useState(bearing);

    // Smooth interpolation logic would go here
    // For this visual test, we just update directly but with a CSS transition on the rotation

    useEffect(() => {
        setCurrentPos(position);
        setCurrentBearing(bearing);
    }, [position, bearing]);

    const icon = L.divIcon({
        className: 'vehicle-marker-icon',
        html: `
      <div style="
        width: 48px;
        height: 48px;
        transform: rotate(${currentBearing}deg);
        transition: transform 0.3s ease-in-out; 
        background-image: url('/assets/vehicles/lift_drive_v1.png');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        filter: drop-shadow(0px 4px 8px rgba(0,0,0,0.3));
      "></div>
    `,
        iconSize: [48, 48],
        iconAnchor: [24, 24], // Center of the 48x48 icon
    });

    return (
        <Marker
            position={currentPos}
            icon={icon}
            ref={markerRef}
            zIndexOffset={100} // Keep vehicles above other markers
        >
            <Popup>
                <div className='font-bold text-center'>
                    Lift Drive<br />
                    <span className='text-xs text-gray-500'>Toyota Vitz • ABC 123</span>
                </div>
            </Popup>
        </Marker>
    );
};

export default VehicleMarker;
