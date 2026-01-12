import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import car3d from '../../assets/3d/car_3d.png';
import { supabase } from '../../lib/supabase';

// Helper for relative time (e.g. "2 days ago")
const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Agora';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min atrás`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h atrás`;
    return `${Math.floor(seconds / 86400)}d atrás`;
};

export const RecentActivityList = () => {
    const [trips, setTrips] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecent = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            // Fetch last 2 completed trips
            const { data } = await supabase
                .from('trips')
                .select('*, driver:drivers(first_name, avatar_url, car_model, license_plate)')
                .eq('passenger_id', user.id)
                .eq('status', 'COMPLETED')
                .order('created_at', { ascending: false })
                .limit(2);

            if (data) {
                // Map to UI format
                const formatted = data.map((t: any) => ({
                    id: t.id,
                    driver: t.driver?.first_name || 'Motorista eLift',
                    code: t.driver?.license_plate || 'ELIFT',
                    car: t.driver?.car_model || 'Carro',
                    pickup: t.origin_address,
                    dest: t.destination_address,
                    avatar: t.driver?.avatar_url || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop',
                    date: t.created_at
                }));
                setTrips(formatted);
            }
            setLoading(false);
        };
        fetchRecent();
    }, []);

    if (loading) return null; // Or a skeleton
    if (trips.length === 0) return null; // Hide if empty

    return (
        <div className="w-full mt-6 mb-24 px-1">
            <h3 className="text-lg font-bold text-[#101b0d] mb-3">Viagens recentes</h3>
            <div className="flex flex-col gap-3">
                {trips.map((item) => (
                    <div key={item.id} className="bg-white rounded-[1.2rem] p-4 shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                    <img src={item.avatar} alt={item.driver} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-extrabold text-[#101b0d]">{item.code}</span>
                                        <span className="text-[10px] text-gray-400 font-normal">• {timeAgo(item.date)}</span>
                                    </div>
                                    <p className="text-xs text-gray-400">{item.driver}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="bg-green-50 text-[#10d772] hover:bg-green-100 hover:text-[#0eb35b] h-8 rounded-full text-[10px] font-bold px-3">
                                Pedir novamente
                            </Button>
                        </div>

                        {/* Route Info */}
                        <div className="grid grid-cols-2 gap-4 relative z-10 w-[70%]">
                            <div>
                                <p className="text-[10px] text-gray-400 mb-0.5">De</p>
                                <p className="text-sm font-bold text-[#101b0d] truncate">{item.pickup}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 mb-0.5">Para</p>
                                <p className="text-sm font-bold text-[#101b0d] truncate">{item.dest}</p>
                            </div>
                        </div>

                        {/* Car Decor */}
                        <img
                            src={car3d}
                            alt="Car"
                            className="absolute bottom-1 -right-2 w-20 object-contain drop-shadow-lg opacity-80"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
