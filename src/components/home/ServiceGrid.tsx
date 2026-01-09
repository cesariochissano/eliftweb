```javascript
import React from 'react';
import { Car, Truck, Bike, Ticket } from 'lucide-react';
import { motion } from 'framer-motion';

// Import Assets
import car3d from '../../assets/3d/car_3d.png';
import tuktuk3d from '../../assets/3d/tuktuk_3d.png';
import scooter3d from '../../assets/3d/scooter_3d.png';
import truck3d from '../../assets/3d/truck_3d.png';

interface ServiceGridProps {
    onSelectService: (serviceId: string) => void;
}

export const ServiceGrid: React.FC<ServiceGridProps> = ({ onSelectService }) => {
    return (
        <div className="w-full h-full flex flex-col gap-[2%] p-4 pb-0">
            {/* Top Section (~63% of height) */}
            <div className="flex-[63] flex gap-[2%] w-full min-h-0">
                {/* HERO CARD (Lift Drive) - Left Col */}
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectService('drive')}
                    className="w-[49%] h-full bg-[#E8F5E9] rounded-[1.5rem] p-4 flex flex-col justify-between relative overflow-hidden group border border-transparent hover:border-green-500/20 transition-all"
                >
                    <div className="z-10 text-left relative">
                        <div className="w-8 h-8 bg-black/5 rounded-full flex items-center justify-center mb-2">
                            <Car size={18} className="text-[#101b0d]" />
                        </div>
                        <h3 className="font-extrabold text-xl text-[#101b0d] leading-none">Lift<br />Drive</h3>
                        <p className="text-[10px] text-gray-500 mt-1 font-medium">Rápido e<br />confortável</p>
                    </div>

                    {/* Visual Decor */}
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#10d772]/20 rounded-full blur-xl group-hover:bg-[#10d772]/30 transition-all" />
                    <img
                        src={car3d}
                        alt="Car"
                        className="absolute bottom-2 -right-4 w-32 h-32 object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-500"
                    />
                </motion.button>

                {/* Right Col Stack */}
                <div className="w-[49%] h-full flex flex-col gap-[4%] min-h-0">
                    {/* Card A (Txopela) - Top Right - ~56% of this col */}
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelectService('txopela')}
                        className="flex-[56] w-full bg-gray-50 rounded-[1.2rem] p-3 flex flex-col justify-between relative overflow-hidden border border-gray-100 min-h-0 group"
                    >
                        <div className="z-10 text-left relative">
                            <h3 className="font-bold text-base text-[#101b0d]">Txopela</h3>
                            <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md font-bold inline-block mt-1">ECONÔMICO</span>
                        </div>
                         {/* Icon/Image Placeholder */}
                         <img
                            src={tuktuk3d}
                            alt="Txopela"
                            className="absolute -bottom-2 -right-2 w-24 h-24 object-contain drop-shadow-lg group-hover:scale-105 transition-transform"
                        />
                    </motion.button>

                    {/* Card D (Bike) - Bottom Right - ~40% of this col */}
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelectService('bike')}
                        className="flex-[40] w-full bg-gray-50 rounded-[1.2rem] p-3 flex flex-col justify-center relative overflow-hidden border border-gray-100 min-h-0 group"
                    >
                         <div className="flex flex-col text-left z-10 relative">
                            <h3 className="font-bold text-sm text-[#101b0d]">Bike</h3>
                            <p className="text-[9px] text-gray-400 leading-tight">Entrega ou<br/>Boleia</p>
                        </div>
                        <img
                            src={scooter3d}
                            alt="Bike"
                            className="absolute bottom-[-10px] right-[-10px] w-20 h-20 object-contain drop-shadow-md group-hover:rotate-3 transition-transform"
                        />
                    </motion.button>
                </div>
            </div>

            {/* Bottom Section (Wide) ~35% */}
            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectService('carga')}
                className="flex-[35] w-full bg-[#101b0d] rounded-[1.2rem] p-4 flex items-center justify-between relative overflow-hidden min-h-0 group"
            >
                <div className="flex items-center gap-3 z-10 relative">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-[#10d772]">
                        <Truck size={20} />
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-lg text-white">Lift Carga</h3>
                        <p className="text-[10px] text-gray-400">Mudanças e mercadorias</p>
                    </div>
                </div>

                {/* Decorative Pattern */}
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#10d772]/10 to-transparent" />
                <img
                    src={truck3d}
                    alt="Truck"
                    className="absolute -bottom-4 right-2 w-32 h-24 object-contain drop-shadow-2xl group-hover:translate-x-2 transition-transform custom-truck-shadow"
                />
            </motion.button>
        </div>
    );
};
```
