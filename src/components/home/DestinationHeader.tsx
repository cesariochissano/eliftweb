

interface DestinationHeaderProps {
    origin: string;
    destination: string;
    onEdit: () => void;
}

export default function DestinationHeader({ origin, destination, onEdit }: DestinationHeaderProps) {
    return (
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 mb-6">
            <div className="flex items-center justify-between">

                {/* Timeline & Addresses */}
                <div className="flex items-stretch gap-4 flex-1">
                    {/* Visual Timeline */}
                    <div className="flex flex-col items-center pt-1.5 pb-1 w-4">
                        {/* Origin Dot (Green) */}
                        <div className="w-2.5 h-2.5 rounded-full bg-[#10d772] ring-4 ring-[#10d772]/20 shadow-sm z-10" />

                        {/* Animated Dotted Line */}
                        <div
                            className="flex-1 w-0.5 my-1 opacity-40 bg-[length:1px_8px] bg-repeat-y"
                            style={{
                                backgroundImage: 'linear-gradient(to bottom, #000 40%, transparent 40%)',
                                animation: 'dashMove 1s linear infinite'
                            }}
                        />
                        <style>{`
                            @keyframes dashMove {
                                0% { background-position: 0 0; }
                                100% { background-position: 0 16px; }
                            }
                        `}</style>

                        {/* Destination Pin (Red/Black style) */}
                        <div className="w-2.5 h-2.5 rounded-full bg-black ring-4 ring-gray-100 shadow-sm z-10" />
                    </div>

                    {/* Text Content */}
                    <div className="flex flex-col gap-6 flex-1 py-0.5">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">Partida</span>
                            <span className="text-sm font-bold text-gray-900 line-clamp-1">{origin}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">Destino</span>
                            <span className="text-sm font-bold text-gray-900 line-clamp-1">{destination}</span>
                        </div>
                    </div>
                </div>

                {/* Edit Button */}
                <button
                    onClick={onEdit}
                    className="ml-4 px-3 py-1.5 bg-green-50 text-[#10d772] text-xs font-bold rounded-lg hover:bg-green-100 transition-colors"
                >
                    EDITAR
                </button>
            </div>
        </div>
    );
}
