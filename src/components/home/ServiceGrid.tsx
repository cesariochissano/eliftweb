import React from 'react';
import { NewServiceCard } from './NewServiceCard';
// Import 3D Assets
import car3d from '../../assets/3d/car_3d.png';
import bike3d from '../../assets/3d/bike_3d.png';
import tuktuk3d from '../../assets/3d/tuktuk_3d.png';
import truck3d from '../../assets/3d/truck_3d.png';

interface ServiceGridProps {
    onSelectService: (serviceId: string) => void;
    selectedService: string;
}

export const ServiceGrid: React.FC<ServiceGridProps> = ({ onSelectService, selectedService }) => {
    return (
        <div className="w-full flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-3 pro:gap-5">
                <NewServiceCard
                    title="Lift Drive"
                    imageSrc={car3d}
                    onClick={() => onSelectService('drive')}
                    selected={selectedService === 'drive'}
                    className="col-span-2 aspect-[21/9] pro:aspect-[21/10] bg-white"
                    badgeText="CONFORTO"
                />
                <NewServiceCard
                    title="Lift Bike"
                    imageSrc={bike3d}
                    onClick={() => onSelectService('bike')}
                    selected={selectedService === 'bike'}
                    className="col-span-1 aspect-square"
                />

                {/* Row 2: Txopela (Span 1) + Carga (Span 2, Visual Dominant) */}
                <NewServiceCard
                    title="Lift Txopela"
                    imageSrc={tuktuk3d}
                    onClick={() => onSelectService('txopela')}
                    selected={selectedService === 'txopela'}
                    className="col-span-1 aspect-square"
                />
                <NewServiceCard
                    title="Lift Carga"
                    imageSrc={truck3d}
                    onClick={() => onSelectService('carga')}
                    selected={selectedService === 'carga'}
                    className="col-span-2 aspect-video pro:aspect-[21/10] bg-white"
                    badgeText="NOVO"
                />
            </div>
        </div>
    );
};
