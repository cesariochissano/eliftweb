import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Link, Plus, X, User, Car, Calendar, History } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface Assignment {
    id: string;
    driver_id: string;
    vehicle_id: string;
    status: 'ACTIVE' | 'ENDED';
    started_at: string;
    ended_at?: string;
    profiles: {
        first_name: string;
        last_name: string;
    };
    vehicles: {
        model: string;
        plate: string;
    };
}

export default function AssignmentsPanel({ fleet }: { fleet: any }) {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const [drivers, setDrivers] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);

    // Form State
    const [selectedDriver, setSelectedDriver] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState('');

    const fetchData = async () => {
        if (!fleet?.id) return;
        setLoading(true);

        // 1. Fetch Assignments
        const { data: aData } = await supabase
            .from('assignments')
            .select('*, profiles(first_name, last_name), vehicles(model, plate)')
            .eq('fleet_id', fleet.id)
            .eq('status', 'ACTIVE');

        if (aData) setAssignments(aData);

        // 2. Fetch Drivers in Fleet
        const { data: dData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .eq('fleet_id', fleet.id)
            .eq('role', 'DRIVER');

        if (dData) setDrivers(dData);

        // 3. Fetch Vehicles in Fleet
        const { data: vData } = await supabase
            .from('vehicles')
            .select('id, model, plate')
            .eq('fleet_id', fleet.id);

        if (vData) setVehicles(vData);

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [fleet?.id]);

    const handleCreateAssignment = async () => {
        if (!selectedDriver || !selectedVehicle || !fleet?.id) return;

        const { error } = await supabase
            .from('assignments')
            .insert([{
                driver_id: selectedDriver,
                vehicle_id: selectedVehicle,
                fleet_id: fleet.id,
                status: 'ACTIVE'
            }]);

        if (!error) {
            fetchData();
            setShowForm(false);
            setSelectedDriver('');
            setSelectedVehicle('');
        } else {
            alert("Erro ao criar atribuição. Verifique se o motorista já está ocupado.");
        }
    };

    const handleEndAssignment = async (id: string) => {
        if (!confirm("Encerrar esta atribuição?")) return;

        const { error } = await supabase
            .from('assignments')
            .update({ status: 'ENDED', ended_at: new Date().toISOString() })
            .eq('id', id);

        if (!error) {
            fetchData();
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-gray-400 font-bold">Carregando atribuições...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Link className="text-primary" /> Atribuições Ativas ({assignments.length})
                </h3>
                <Button onClick={() => setShowForm(!showForm)} size="sm" className="font-bold">
                    {showForm ? 'Cancelar' : <><Plus size={18} className="mr-2" /> Nova Atribuição</>}
                </Button>
            </div>

            {showForm && (
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Motorista</label>
                        <select
                            value={selectedDriver}
                            onChange={(e) => setSelectedDriver(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary appearance-none cursor-pointer"
                        >
                            <option value="">Seleccionar Motorista</option>
                            {drivers.map(d => (
                                <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Veículo</label>
                        <select
                            value={selectedVehicle}
                            onChange={(e) => setSelectedVehicle(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary appearance-none cursor-pointer"
                        >
                            <option value="">Seleccionar Veículo</option>
                            {vehicles.map(v => (
                                <option key={v.id} value={v.id}>{v.model} ({v.plate})</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <Button
                            onClick={handleCreateAssignment}
                            disabled={!selectedDriver || !selectedVehicle}
                            className="w-full font-bold h-[46px]"
                        >
                            Confirmar Atribuição
                        </Button>
                    </div>
                </div>
            )}

            {assignments.length === 0 ? (
                <div className="text-center p-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center">
                    <Link size={48} className="mb-4 opacity-10" />
                    <p className="text-gray-500 font-medium">Nenhuma atribuição activa no momento.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assignments.map((a) => (
                        <div key={a.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />

                            <div className="flex justify-between items-start mb-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        <User size={14} /> Motorista
                                    </div>
                                    <div className="font-bold text-gray-900">{a.profiles.first_name} {a.profiles.last_name}</div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-gray-300 hover:text-red-500 group-hover:opacity-100 opacity-0 transition-opacity"
                                    onClick={() => handleEndAssignment(a.id)}
                                >
                                    <X size={18} />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        <Car size={14} /> Veículo
                                    </div>
                                    <div className="font-bold text-gray-900">{a.vehicles.model}</div>
                                    <div className="text-[10px] font-mono bg-gray-100 px-2 py-0.5 rounded inline-block font-bold border border-gray-200">
                                        {a.vehicles.plate}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 bg-gray-50 p-2 rounded-lg">
                                    <Calendar size={12} />
                                    Desde {new Date(a.started_at).toLocaleDateString('pt-MZ')} às {new Date(a.started_at).toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-8 border-t border-gray-100 pt-6">
                <Button variant="ghost" size="sm" className="text-gray-400 font-bold hover:text-gray-600">
                    <History size={16} className="mr-2" /> Ver Histórico de Atribuições
                </Button>
            </div>
        </div>
    );
}
