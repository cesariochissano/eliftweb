import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, MapPin, Clock, Calendar, ChevronRight, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';

import Map from '../../components/map/Map'; // Import Map

export default function PassengerTrips() {
    const navigate = useNavigate();
    const [trips, setTrips] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [reportTrip, setReportTrip] = useState<any>(null); // Renamed for clarity
    const [viewTrip, setViewTrip] = useState<any>(null); // For details/map modal

    useEffect(() => {
        const fetchTrips = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('trips')
                .select(`
                    *,
                    driver:drivers (
                        id,
                        profiles (
                            first_name,
                            last_name,
                            avatar_url,
                            rating
                        )
                    )
                `)
                .eq('passenger_id', user.id)
                .order('created_at', { ascending: false });

            if (data) {
                // Filter logic
                const relevantTrips = data.filter((trip: any) =>
                    trip.status !== 'CANCELLED' ||
                    (trip.status === 'CANCELLED' && trip.driver_id !== null) ||
                    trip.status === 'NO_DRIVERS'
                );
                setTrips(relevantTrips);
            }
            setLoading(false);
        };

        fetchTrips();
    }, []);

    const handleReport = (type: string) => {
        if (!reportTrip) return;

        if (type === 'accident') {
            navigate('/passenger/report-accident', { state: { tripId: reportTrip.id } });
        } else {
            navigate('/passenger/contact', {
                state: {
                    tripId: reportTrip.id,
                    reportType: type,
                    initialSubject: type === 'forgot_item' ? 'Esqueci um item' : 'Problema com viagem'
                }
            });
        }
        setReportTrip(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="bg-white p-4 pt-safe shadow-sm flex items-center gap-4 sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </Button>
                <h1 className="text-xl font-bold">Minhas Viagens</h1>
            </header>

            <main className="flex-1 p-4 pb-safe space-y-4">
                {loading ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin w-8 h-8 border-4 border-[#3ae012] border-t-transparent rounded-full" />
                    </div>
                ) : trips.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Ainda não realizou nenhuma viagem.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {trips.map((trip) => (
                            <div key={trip.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100" onClick={() => setViewTrip(trip)}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="text-xs text-gray-500 font-medium mb-1">
                                            {new Date(trip.created_at).toLocaleDateString('pt-PT', {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                        <div className={`text-xs font-bold px-2 py-1 rounded-full w-fit ${trip.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                            trip.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {trip.status === 'COMPLETED' ? 'Concluída' :
                                                trip.status === 'CANCELLED' ? 'Cancelada' : 'Em Andamento'}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-lg">{parseFloat(trip.price?.toString().replace('$', '') || '0')} MZN</div>
                                        {trip.driver?.profiles && (
                                            <div className="flex items-center justify-end gap-2 mt-2">
                                                <div className="text-xs text-right text-gray-500">
                                                    <div>{trip.driver.profiles.first_name}</div>
                                                    <div className="flex text-yellow-500">{'★'.repeat(Math.round(trip.driver.profiles.rating || 5))}</div>
                                                </div>
                                                <img
                                                    src={trip.driver.profiles.avatar_url || 'https://via.placeholder.com/40'}
                                                    alt="Driver"
                                                    className="w-8 h-8 rounded-full border border-gray-100 object-cover"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="relative pl-6 space-y-4 mb-4">
                                    {/* Timeline Line */}
                                    <div className="absolute left-2 top-2 bottom-4 w-0.5 bg-gray-200" />

                                    <div className="relative">
                                        <div className="absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-green-500 bg-white" />
                                        <div className="text-sm font-bold text-gray-900 line-clamp-1">{trip.origin_address}</div>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-red-500 bg-white" />
                                        <div className="text-sm font-bold text-gray-900 line-clamp-1">{trip.destination_address}</div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-50 flex justify-between items-center text-xs text-gray-500">
                                    <div className="flex gap-4">
                                        <span className="flex items-center gap-1"><Clock size={14} /> {trip.duration_min} min</span>
                                        <span className="flex items-center gap-1"><MapPin size={14} /> {trip.distance_km} km</span>
                                    </div>
                                    <Button
                                        variant="ghost" size="sm"
                                        className="text-gray-400 hover:text-gray-600 font-medium h-8"
                                        onClick={(e) => { e.stopPropagation(); setReportTrip(trip); }}
                                    >
                                        Relatar Problema
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* View Details/Map Modal */}
            {viewTrip && (
                <div className="fixed inset-0 z-50 flex flex-col bg-white animate-in slide-in-from-right duration-300">
                    <header className="p-4 pt-safe shadow-sm flex items-center gap-4 z-10 bg-white">
                        <Button variant="ghost" size="icon" onClick={() => setViewTrip(null)}>
                            <ArrowLeft size={24} />
                        </Button>
                        <h1 className="text-xl font-bold">Detalhes da Viagem</h1>
                    </header>

                    <div className="flex-1 relative">
                        {/* Map Section */}
                        <div className="h-1/2 w-full relative">
                            {viewTrip.origin_lat && viewTrip.dest_lat ? (
                                <Map
                                    userLocation={{ lat: viewTrip.origin_lat, lng: viewTrip.origin_lng }}
                                    pickupLocation={{ lat: viewTrip.origin_lat, lng: viewTrip.origin_lng }}
                                    destinationLocation={{ lat: viewTrip.dest_lat, lng: viewTrip.dest_lng }}
                                    tripStatus="IN_PROGRESS" // Force route rendering
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                    Mapa indisponível para esta viagem antiga
                                </div>
                            )}
                        </div>

                        {/* Details Section */}
                        <div className="p-6 space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold">{parseFloat(viewTrip.price?.toString().replace('$', '') || '0')} MZN</h2>
                                    <p className="text-sm text-gray-500">{viewTrip.payment_method === 'WALLET' ? 'Carteira eLift' : 'Dinheiro'}</p>
                                </div>
                                <div className={`text-xs font-bold px-3 py-1 rounded-full ${viewTrip.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {viewTrip.status === 'COMPLETED' ? 'Concluída' : 'Cancelada'}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 w-2 h-2 rounded-full bg-green-500" />
                                    <div>
                                        <p className="text-xs text-gray-500">Origem</p>
                                        <p className="font-semibold text-sm">{viewTrip.origin_address}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 w-2 h-2 rounded-full bg-red-500" />
                                    <div>
                                        <p className="text-xs text-gray-500">Destino</p>
                                        <p className="font-semibold text-sm">{viewTrip.destination_address}</p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                className="w-full mt-8 bg-gray-100 text-gray-900 hover:bg-gray-200"
                                onClick={() => { setReportTrip(viewTrip); }}
                            >
                                <AlertCircle className="mr-2 h-4 w-4" />
                                Relatar Problema
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reporting Options Drawer */}
            {reportTrip && (
                <div className="fixed inset-0 z-[60] flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setReportTrip(null)} />
                    <div className="bg-white w-full rounded-t-[2rem] p-6 z-10 animate-in slide-in-from-bottom duration-300 pb-safe">
                        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
                        <h2 className="text-xl font-bold mb-4 px-2">Relatar um problema</h2>
                        <div className="space-y-2">
                            <button className="w-full text-left p-4 rounded-xl hover:bg-gray-50 font-bold flex justify-between items-center" onClick={() => handleReport('forgot_item')}>
                                Esqueci um item
                                <ChevronRight size={20} className="text-gray-300" />
                            </button>
                            <button className="w-full text-left p-4 rounded-xl hover:bg-gray-50 font-bold flex justify-between items-center" onClick={() => handleReport('driver_issue')}>
                                Motorista não profissional
                                <ChevronRight size={20} className="text-gray-300" />
                            </button>
                            <button className="w-full text-left p-4 rounded-xl hover:bg-gray-50 font-bold flex justify-between items-center" onClick={() => handleReport('vehicle_issue')}>
                                Veículo em más condições
                                <ChevronRight size={20} className="text-gray-300" />
                            </button>
                            <div className="h-px bg-gray-100 my-2" />
                            <button className="w-full text-left p-4 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-bold flex justify-between items-center" onClick={() => handleReport('accident')}>
                                Esteve num acidente?
                                <AlertCircle size={20} />
                            </button>
                        </div>
                        <Button variant="ghost" className="w-full mt-4 font-bold h-12 rounded-xl" onClick={() => setReportTrip(null)}>
                            Cancelar
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
