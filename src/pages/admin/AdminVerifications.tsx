import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Check, X, FileText, RefreshCw } from 'lucide-react';

interface PendingDriver {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    document_status: 'PENDING' | 'APPROVED' | 'REJECTED';
    license_url: string | null;
    id_card_url: string | null;
}

export default function AdminVerifications() {
    const [drivers, setDrivers] = useState<PendingDriver[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPendingDrivers();
    }, []);

    const fetchPendingDrivers = async () => {
        setLoading(true);
        // Join drivers with profiles to get name/phone
        const { data, error } = await supabase
            .from('drivers')
            .select(`
                id,
                document_status,
                license_url,
                id_card_url,
                profiles:id (
                    first_name,
                    last_name,
                    phone
                )
            `)
            .eq('document_status', 'PENDING');

        if (error) {
            console.error('Error fetching drivers:', error);
        } else if (data) {
            // Flatten the data structure
            const formatted = data.map((d: any) => ({
                id: d.id,
                first_name: d.profiles?.first_name || 'N/A',
                last_name: d.profiles?.last_name || 'N/A',
                phone: d.profiles?.phone || 'N/A',
                document_status: d.document_status,
                license_url: d.license_url,
                id_card_url: d.id_card_url
            }));
            setDrivers(formatted);
        }
        setLoading(false);
    };

    const updateStatus = async (driverId: string, status: 'APPROVED' | 'REJECTED') => {
        const { error } = await supabase
            .from('drivers')
            .update({ document_status: status })
            .eq('id', driverId);

        if (!error) {
            // Remove from list locally
            setDrivers(drivers.filter(d => d.id !== driverId));

            // If approved, maybe notify? (Skip for MVP)
        } else {
            alert('Erro ao atualizar status');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tighter">Verificação de Motoristas</h1>
                    <p className="text-sm font-medium text-gray-400">Analise os documentos e aprove os registros pendentes.</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchPendingDrivers}
                    disabled={loading}
                    className="gap-2"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Atualizar
                </Button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600">Motorista</th>
                                <th className="p-4 font-semibold text-gray-600">Telefone</th>
                                <th className="p-4 font-semibold text-gray-600">Documentos</th>
                                <th className="p-4 font-semibold text-gray-600 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-400">Carregando...</td>
                                </tr>
                            )}
                            {!loading && drivers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-400">
                                        Nenhum motorista pendente no momento.
                                    </td>
                                </tr>
                            )}
                            {!loading && drivers.map((driver) => (
                                <tr key={driver.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-gray-900">{driver.first_name} {driver.last_name}</div>
                                        <div className="text-xs text-gray-400 font-mono">{driver.id.slice(0, 8)}...</div>
                                    </td>
                                    <td className="p-4 text-gray-600">{driver.phone}</td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            {driver.license_url ? (
                                                <a href={driver.license_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:underline">
                                                    <FileText size={12} /> Carta
                                                </a>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Sem Carta</span>
                                            )}
                                            {driver.id_card_url ? (
                                                <a href={driver.id_card_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded hover:underline">
                                                    <FileText size={12} /> BI
                                                </a>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Sem BI</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                                                onClick={() => updateStatus(driver.id, 'REJECTED')}
                                            >
                                                <X size={16} /> Rejeitar
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 text-white gap-1"
                                                onClick={() => updateStatus(driver.id, 'APPROVED')}
                                            >
                                                <Check size={16} /> Aprovar
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">Carregando...</div>
                ) : drivers.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 bg-white rounded-xl">
                        Nenhum motorista pendente.
                    </div>
                ) : (
                    drivers.map(driver => (
                        <div key={driver.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-bold text-gray-900">{driver.first_name} {driver.last_name}</div>
                                    <div className="text-sm text-gray-500">{driver.phone}</div>
                                </div>
                                <div className="text-[10px] text-gray-400 font-mono">#{driver.id.slice(0, 6)}</div>
                            </div>

                            <div className="flex gap-2">
                                {driver.license_url && (
                                    <Button variant="outline" size="sm" className="flex-1 text-xs gap-1" onClick={() => window.open(driver.license_url!, '_blank')}>
                                        <FileText size={14} /> Ver Carta
                                    </Button>
                                )}
                                {driver.id_card_url && (
                                    <Button variant="outline" size="sm" className="flex-1 text-xs gap-1" onClick={() => window.open(driver.id_card_url!, '_blank')}>
                                        <FileText size={14} /> Ver BI
                                    </Button>
                                )}
                            </div>

                            <div className="flex gap-2 pt-2 border-t border-gray-50">
                                <Button
                                    variant="outline"
                                    className="flex-1 border-red-200 text-red-500 text-xs"
                                    onClick={() => updateStatus(driver.id, 'REJECTED')}
                                >
                                    Rejeitar
                                </Button>
                                <Button
                                    className="flex-1 bg-green-600 text-white text-xs"
                                    onClick={() => updateStatus(driver.id, 'APPROVED')}
                                >
                                    Aprovar
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
