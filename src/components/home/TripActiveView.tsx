import { useState } from 'react';
import { Phone, MessageSquare, Shield, Share2, X } from 'lucide-react';
import { useTripStore } from '../../stores/useTripStore';

interface TripActiveViewProps {
    onChatOpen: () => void;
}

export function TripActiveView({ onChatOpen }: TripActiveViewProps) {
    const { status, tripDetails, cancelTrip } = useTripStore();
    const [showCancelOptions, setShowCancelOptions] = useState(false);

    const handleCancel = async (reason: string) => {
        if (!tripDetails) return;
        await cancelTrip(tripDetails.id, reason);
    };

    if (!tripDetails) return null;

    return (
        <div className="flex-1 px-6 pb-6 flex flex-col items-stretch">

            {/* STATUS HEADER - Compact */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">
                        {status === 'REQUESTING' && 'Procurando Motorista...'}
                        {status === 'ACCEPTED' && 'Motorista a Caminho'}
                        {status === 'ARRIVED' && 'Motorista Chegou'}
                        {status === 'IN_PROGRESS' && 'Em Viagem'}
                    </h2>
                    <p className="text-[13px] text-gray-500 font-medium -mt-0.5">
                        {status === 'REQUESTING' && 'Aguarde um momento'}
                        {status === 'ACCEPTED' && `Chega em ~5 min`}
                        {status === 'ARRIVED' && 'Encontre o veículo no ponto'}
                        {status === 'IN_PROGRESS' && `Destino: ${tripDetails.destination.split(',')[0]}`}
                    </p>
                </div>

                <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${status === 'REQUESTING' ? 'bg-yellow-100 text-yellow-700 animate-pulse' :
                    status === 'IN_PROGRESS' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                    }`}>
                    {status}
                </div>
            </div>

            {/* DRIVER INFO (If Assigned) */}
            {(status === 'ACCEPTED' || status === 'ARRIVED' || status === 'IN_PROGRESS') && (
                <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500">
                        DR
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold">João Motorista</h3>
                        <p className="text-xs text-gray-500">Toyota Corolla • ABC-123</p>
                        <div className="flex gap-1 mt-1">
                            <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full">⭐ 4.9</span>
                        </div>
                    </div>

                    {/* Actions (Chat/Call) */}
                    <div className="flex gap-2">
                        {status !== 'IN_PROGRESS' && (
                            <button onClick={onChatOpen} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-600">
                                <MessageSquare size={20} />
                            </button>
                        )}
                        <button className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-sm text-white">
                            <Phone size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* TRIP PROGRESS (Radar or Route) */}
            {status === 'REQUESTING' && (
                <div className="flex flex-col items-center justify-center py-4 bg-gray-50/50 rounded-3xl mb-4">
                    <div className="relative">
                        {/* Multiple Radar Waves */}
                        <div className="absolute inset-0 bg-black/5 rounded-full animate-radar scale-[2]"></div>
                        <div className="absolute inset-0 bg-black/10 rounded-full animate-radar delay-700 scale-[1.5]"></div>
                        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md relative z-10 border border-gray-100">
                            <div className="w-11 h-11 bg-black rounded-full flex items-center justify-center text-white">
                                <span className="text-lg font-bold">DR</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs font-bold mt-3 text-gray-400 uppercase tracking-widest">Buscando na área...</p>
                </div>
            )}

            {/* ACTIONS GRID (Safety, Share, Cancel) - Unified & Balanced */}
            <div className="flex items-center gap-3 mt-auto pb-8">
                {/* Secondary Actions (Icon Only) */}
                <div className="flex gap-2">
                    <button className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-700 active:scale-90 transition-all">
                        <Shield size={20} />
                    </button>
                    <button className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-700 active:scale-90 transition-all">
                        <Share2 size={20} />
                    </button>
                </div>

                {/* Primary Action (Cancel) */}
                <div className="flex-1">
                    {showCancelOptions ? (
                        <div className="flex gap-2 animate-fade-in h-12">
                            <button
                                onClick={() => handleCancel('passenger_changed_mind')}
                                className="flex-1 bg-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center px-4 shadow-lg shadow-red-200 active:scale-95 transition-all"
                            >
                                Confirmar
                            </button>
                            <button
                                onClick={() => setShowCancelOptions(false)}
                                className="h-12 w-12 bg-gray-200 rounded-2xl flex items-center justify-center text-gray-600 active:scale-95 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowCancelOptions(true)}
                            className="w-full h-12 bg-gray-100 text-gray-500 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-500 active:scale-95 transition-all"
                        >
                            <X size={16} />
                            Cancelar
                        </button>
                    )}
                </div>
            </div>

        </div>
    );
}
