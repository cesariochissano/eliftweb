import React from 'react';
import { NewServiceCard } from './NewServiceCard';
import { motion } from 'framer-motion';

// Import 3D Assets
import car3d from '../../assets/3d/car_3d.png';
import bike3d from '../../assets/3d/bike_3d.png';
import tuktuk3d from '../../assets/3d/tuktuk_3d.png';
import truck3d from '../../assets/3d/truck_3d.png';

interface ServiceGridProps {
    onSelectService: (serviceId: string) => void;
}

export const ServiceGrid: React.FC<ServiceGridProps> = ({ onSelectService }) => {
    return (
        <div className="w-full flex flex-col gap-4">
            {/* Row of 3 Cards */}
            <div className="grid grid-cols-3 gap-3">
                <NewServiceCard
                    title="Lift Drive"
                    imageSrc={car3d}
                    onClick={() => onSelectService('drive')}
                    selected={false}
                />
                <NewServiceCard
                    title="Lift Bike"
                    imageSrc={bike3d}
                    onClick={() => onSelectService('bike')}
                    selected={false}
                />
                <NewServiceCard
                    title="Lift Txopela"
                    imageSrc={tuktuk3d}
                    onClick={() => onSelectService('txopela')}
                    selected={false}
                />
            </div>

            {/* Full Width "Lift Carga" Card - Custom Design to match wireframe (Green Background) */}
            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectService('carga')}
                className="w-full h-[120px] bg-[#E8F5E9] rounded-[1.5rem] p-5 flex items-center justify-between relative overflow-hidden group border border-transparent hover:border-green-500/20 transition-all shadow-sm"
            >
                {/* Content */}
                <div className="z-10 text-left">
                    <h3 className="font-extrabold text-xl text-[#101b0d] leading-none mb-1">Lift Carga</h3>
                    <p className="text-sm text-gray-600 font-medium">Transporte seguro de cargas</p>
                </div>

                {/* Decorative Pattern / Image */}
                <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />

                {/* Truck Image */}
                <img
                    src={truck3d}
                    alt="Truck"
                    className="absolute bottom-0 right-0 h-[95%] w-auto max-w-[55%] object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-500 mr-2 mb-1"
                />
            </motion.button>
        </div>
    );
};
