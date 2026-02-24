import React, { useEffect, useState, useRef } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';

// Import 3D Assets (Correct Paths)
import carTop from '../../assets/map/car_top.png';
import bike3d from '../../assets/3d/bike_3d.png';
import tuktuk3d from '../../assets/3d/tuktuk_3d.png';
import truck3d from '../../assets/3d/truck_3d.png';

interface VehicleMarkerProps {
    position: [number, number]; // [lat, lng]
    bearing: number;           // 0-360 degrees
    type?: 'drive' | 'bike' | 'txopela' | 'carga';
    previousPosition?: [number, number];
}

const VehicleMarker: React.FC<VehicleMarkerProps> = ({ position, bearing, type = 'drive' }) => {
    const markerRef = useRef<L.Marker>(null);
    const [currentPos, setCurrentPos] = useState(position);
    const [currentBearing, setCurrentBearing] = useState(bearing);

    // Asset Selection
    const getIconSrc = () => {
        switch (type) {
            case 'bike': return bike3d;
            case 'txopela': return tuktuk3d;
            case 'carga': return truck3d;
            case 'drive':
            default: return carTop; // Correct Top-Down Asset
        }
    };

    const iconSrc = getIconSrc();

    useEffect(() => {
        setCurrentPos(position);
        setCurrentBearing(bearing);
    }, [position, bearing]);

    const icon = L.divIcon({
        className: 'vehicle-marker-icon',
        html: `
      <div style="
        width: 20px;
        height: 38px;
        transform: rotate(${currentBearing}deg);
        transition: transform 0.3s ease-in-out; 
        background-image: url('${iconSrc}');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.3));
      "></div>
    `,
        iconSize: [20, 38], // Even smaller (to fit line)
        iconAnchor: [10, 19], // Center
    });

    return (
        <Marker
            position={currentPos}
            icon={icon}
            ref={markerRef}
            zIndexOffset={100}
        >
            {/* Removed Popup to keep map clean (Uber style) */}
        </Marker>
    );
};

export default VehicleMarker;
