import { motion } from 'framer-motion';
import { Phone, MessageSquare, Navigation, Shield, AlertTriangle } from 'lucide-react';
import type { TripDetails } from '../../types/trip';

interface DriverNavigationModeProps {
    trip: TripDetails;
    status: 'ACCEPTED' | 'ARRIVED' | 'IN_PROGRESS';
    onAction: (action: string, payload?: any) => void;
    onNavigate: () => void;
}

export function DriverNavigationMode({ trip, status, onAction, onNavigate }: DriverNavigationModeProps) {
    const isInProgress = status === 'IN_PROGRESS';

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[600] pointer-events-none flex flex-col justify-end h-screen">

            {/* Top Info Cards (Floating) */}
            <div className="w-full p-4 pointer-events-auto mb-auto pt-16">
                {/* Navigation Strip */}
                <div className="bg-black text-white p-4 rounded-2xl shadow-lg flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <Navigation size={20} className="text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold">
                                {isInProgress ? 'Destino' : 'Recolha'}
                            </p>
                            <h3 className="font-bold text-lg line-clamp-1">
                                {isInProgress ? trip.destination.split(',')[0] : trip.origin.split(',')[0]}
                            </h3>
                        </div>
                    </div>
                    <button
                        onClick={onNavigate}
                        className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-blue-900/50"
                    >
                        Navegar
                    </button>
                </div>
            </div>

            {/* Bottom Controls */}
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="bg-white rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] p-6 pointer-events-auto"
            >
                {/* Passenger Info */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="font-bold text-gray-500">PA</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Passageiro</h3>
                            {isInProgress && (
                                <p className="text-green-600 text-xs font-bold animate-pulse">
                                    • Estimativa em atualização
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onAction('call')}
                            className="w-12 h-12 bg-green-100 text-green-700 rounded-2xl flex items-center justify-center"
                        >
                            <Phone size={24} />
                        </button>
                        <button
                            onClick={() => onAction('chat')}
                            className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center"
                        >
                            <MessageSquare size={24} />
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    {/* Primary Action Button (Slide Simulation) */}
                    <button
                        onClick={() => {
                            if (status === 'ACCEPTED') onAction('arrive');
                            else if (status === 'ARRIVED') onAction('start');
                            else if (status === 'IN_PROGRESS') onAction('complete');
                        }}
                        className={`
                            h-16 w-full rounded-2xl font-bold text-white text-xl shadow-lg
                            active:scale-95 transition-transform flex items-center justify-center gap-2
                            ${status === 'ACCEPTED' ? 'bg-blue-600' :
                                status === 'ARRIVED' ? 'bg-green-600' :
                                    'bg-black'}
                        `}
                    >
                        {status === 'ACCEPTED' && '📍 Confirmar Chegada'}
                        {status === 'ARRIVED' && '🚀 Iniciar Viagem'}
                        {status === 'IN_PROGRESS' && '🏁 Finalizar Viagem'}
                    </button>

                    {/* Secondary Actions */}
                    {status === 'ARRIVED' && (
                        <button
                            onClick={() => onAction('notify_arrival')}
                            className="h-12 w-full bg-gray-100 text-gray-700 font-bold rounded-xl text-sm"
                        >
                            🔔 Enviar "Cheguei"
                        </button>
                    )}

                    <div className="grid grid-cols-2 gap-3 mt-2">
                        <button
                            onClick={() => onAction('cancel')}
                            className="h-12 rounded-xl bg-gray-50 text-red-500 font-bold text-sm flex items-center justify-center gap-2"
                        >
                            <AlertTriangle size={16} />
                            Cancelar
                        </button>
                        <button
                            className="h-12 rounded-xl bg-gray-50 text-gray-500 font-bold text-sm flex items-center justify-center gap-2"
                        >
                            <Shield size={16} />
                            SOS
                        </button>
                    </div>
                </div>

            </motion.div>
        </div>
    );
}
