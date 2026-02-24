import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Navigation, User } from 'lucide-react';
import type { TripDetails } from '../../types/trip';
import { Card } from '../ui/card';

interface DriverRequestCardProps {
    trip: TripDetails;
    onAccept: () => void;
    onReject: () => void;
}

export function DriverRequestCard({ trip, onAccept, onReject }: DriverRequestCardProps) {
    const [timeLeft, setTimeLeft] = useState(30);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onReject(); // Auto reject on timeout
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [onReject]);

    return (
        <motion.div
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-[700] p-4 pb-6"
        >
            <Card className="shadow-2xl overflow-hidden border border-gray-100 p-0 rounded-3xl">
                {/* Header with Timer */}
                <div className="bg-black text-white p-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="animate-pulse w-3 h-3 bg-green-500 rounded-full"></span>
                        <span className="font-bold text-lg">Nova Solicitação</span>
                    </div>
                    <div className="font-mono font-bold text-xl text-yellow-500">
                        {timeLeft}s
                    </div>
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col gap-6">
                    {/* Price & Distance */}
                    <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                            <span className="text-gray-500 text-sm font-bold">GANHO ESTIMADO</span>
                            <span className="text-4xl font-extrabold text-gray-900">{trip.price} MT</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-bold text-gray-600 mb-1">
                                {trip.distance}
                            </span>
                            <span className="text-sm text-gray-500">~{trip.duration}</span>
                        </div>
                    </div>

                    {/* Route Visual */}
                    <div className="relative pl-6 py-2 flex flex-col gap-6">
                        {/* Line */}
                        <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-gray-200"></div>

                        {/* Pickup */}
                        <div className="relative">
                            <div className="absolute -left-6 top-1 w-4 h-4 bg-black rounded-full border-2 border-white shadow-sm"></div>
                            <h4 className="font-bold text-gray-900 text-sm">Recolha</h4>
                            <p className="text-sm text-gray-500 line-clamp-1">{trip.origin}</p>
                            <span className="text-xs text-blue-600 font-bold mt-1 block">2.3 km até lá</span>
                        </div>

                        {/* Dest */}
                        <div className="relative">
                            <div className="absolute -left-6 top-1 w-4 h-4 bg-black rounded-sm border-2 border-white shadow-sm"></div>
                            <h4 className="font-bold text-gray-900 text-sm">Destino</h4>
                            <p className="text-sm text-gray-500 line-clamp-1">{trip.destination}</p>
                        </div>
                    </div>

                    {/* Passenger Mini Info */}
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                            <User size={20} />
                        </div>
                        <div>
                            <span className="font-bold text-sm block">Passageiro</span>
                            <span className="text-xs text-gray-500">4.8 ⭐ (120 viagens)</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-[1fr_2fr] gap-3 mt-2">
                        <button
                            onClick={onReject}
                            className="h-14 rounded-2xl bg-gray-100 font-bold text-gray-500 active:scale-95 transition-transform"
                        >
                            Ignorar
                        </button>

                        <button
                            onClick={onAccept}
                            className="h-14 rounded-2xl bg-black text-white font-bold text-lg shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
                        >
                            ACEITAR
                            <Navigation size={20} className="text-[#10d772]" />
                        </button>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
