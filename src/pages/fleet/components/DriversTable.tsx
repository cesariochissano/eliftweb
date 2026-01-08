import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Badge } from '../../../components/ui/badge.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar.tsx';

interface Driver {
    id: string;
    is_online: boolean;
    profiles: {
        first_name: string;
        last_name: string;
        phone: string;
        avatar_url: string | null;
    };
}

export default function DriversTable({ limit, fleet }: { limit?: number; fleet?: any }) {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const isCorporate = fleet?.type === 'CORPORATE';

    useEffect(() => {
        const fetchDrivers = async () => {
            let query = supabase
                .from('drivers')
                .select(`
                    id,
                    is_online,
                    profiles:id (
                        first_name,
                        last_name,
                        phone,
                        avatar_url
                    )
                `)
                .order('is_online', { ascending: false }); // Show online first

            if (limit) {
                query = query.limit(limit);
            }

            const { data, error } = await query;
            if (error) console.error('Error fetching drivers:', error);
            else if (data) setDrivers(data as any);
        };

        fetchDrivers();

        // Subscribe to status changes
        const channel = supabase.channel('drivers-table')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'drivers' }, (_: any) => {
                // Determine if we should update logic updates... for simplicity re-fetch or optimistically update
                fetchDrivers();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [limit]);

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                    <tr>
                        <th className="px-4 py-3">Motorista</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Telefone</th>
                        <th className="px-4 py-3 text-right">{isCorporate ? 'Viagens' : 'Ganhos (Hoje)'}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {drivers.map((driver) => (
                        <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={driver.profiles.avatar_url || ''} />
                                        <AvatarFallback>{driver.profiles.first_name[0]}{driver.profiles.last_name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-bold text-sm text-gray-900">
                                            {driver.profiles.first_name} {driver.profiles.last_name}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-mono">ID: {driver.id.slice(0, 6)}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                <Badge variant={driver.is_online ? 'success' : 'secondary'} className={driver.is_online ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                                    {driver.is_online ? 'Online' : 'Offline'}
                                </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                                {driver.profiles.phone}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-900">
                                {isCorporate ? (Math.floor(Math.random() * 15) + ' vgs') : '1.250 MT'}
                            </td>
                        </tr>
                    ))}
                    {drivers.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">
                                Nenhum motorista encontrado.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
