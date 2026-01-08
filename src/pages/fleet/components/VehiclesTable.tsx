import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Car, Plus, Trash2, Edit } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface Vehicle {
    id: string;
    plate: string;
    model: string;
    year: number;
    type: 'ECONOMY' | 'COMFORT' | 'XL' | 'BIKE' | 'PACKAGE' | 'TRUCK';
    fleet_id: string;
}

export default function VehiclesTable({ fleet }: { fleet: any }) {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    // Form State
    const [newVehicle, setNewVehicle] = useState<{
        plate: string;
        model: string;
        year: number;
        type: 'ECONOMY' | 'COMFORT' | 'XL' | 'BIKE' | 'PACKAGE' | 'TRUCK';
    }>({
        plate: '',
        model: '',
        year: new Date().getFullYear(),
        type: 'ECONOMY'
    });
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

    const fetchVehicles = async () => {
        if (!fleet?.id) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('fleet_id', fleet.id);

        if (!error && data) {
            setVehicles(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchVehicles();
    }, [fleet?.id]);

    const handleAddVehicle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fleet?.id) return;

        if (editingVehicle) {
            const { data, error } = await supabase
                .from('vehicles')
                .update(newVehicle)
                .eq('id', editingVehicle.id)
                .select();

            if (!error && data) {
                setVehicles(vehicles.map(v => v.id === editingVehicle.id ? data[0] : v));
                setEditingVehicle(null);
                setShowAddForm(false);
                setNewVehicle({ plate: '', model: '', year: new Date().getFullYear(), type: 'ECONOMY' });
            } else {
                alert(error?.message || "Erro ao atualizar veículo.");
            }
        } else {
            const { data, error } = await supabase
                .from('vehicles')
                .insert([{ ...newVehicle, fleet_id: fleet.id }])
                .select();

            if (!error && data) {
                setVehicles([...vehicles, data[0]]);
                setShowAddForm(false);
                setNewVehicle({ plate: '', model: '', year: new Date().getFullYear(), type: 'ECONOMY' });
            } else {
                alert(error?.message || "Erro ao adicionar veículo.");
            }
        }
    };

    const handleDeleteVehicle = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este veículo?")) return;

        const { error } = await supabase
            .from('vehicles')
            .delete()
            .eq('id', id);

        if (!error) {
            setVehicles(vehicles.filter(v => v.id !== id));
        } else {
            alert("Erro ao excluir veículo.");
        }
    };

    const handleEditClick = (v: Vehicle) => {
        setEditingVehicle(v);
        setNewVehicle({
            plate: v.plate,
            model: v.model,
            year: v.year,
            type: v.type
        });
        setShowAddForm(true);
    };

    if (loading) return <div className="p-8 text-center animate-pulse text-gray-400 font-bold">Carregando veículos...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Car className="text-primary" /> Veículos Registados ({vehicles.length})
                </h3>
                <Button onClick={() => {
                    if (showAddForm) {
                        setEditingVehicle(null);
                        setNewVehicle({ plate: '', model: '', year: new Date().getFullYear(), type: 'ECONOMY' });
                    }
                    setShowAddForm(!showAddForm);
                }} size="sm" className="font-bold">
                    {showAddForm ? 'Cancelar' : <><Plus size={18} className="mr-2" /> Adicionar</>}
                </Button>
            </div>

            {showAddForm && (
                <form onSubmit={handleAddVehicle} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Matrícula</label>
                        <input
                            required
                            type="text"
                            placeholder="ABC 123 MC"
                            value={newVehicle.plate}
                            onChange={e => setNewVehicle({ ...newVehicle, plate: e.target.value.toUpperCase() })}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Marca / Modelo</label>
                        <input
                            required
                            type="text"
                            placeholder="Toyota Ractis"
                            value={newVehicle.model}
                            onChange={e => setNewVehicle({ ...newVehicle, model: e.target.value })}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Ano</label>
                        <input
                            required
                            type="number"
                            value={newVehicle.year}
                            onChange={e => setNewVehicle({ ...newVehicle, year: parseInt(e.target.value) })}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tipo</label>
                        <select
                            value={newVehicle.type}
                            onChange={e => setNewVehicle({ ...newVehicle, type: e.target.value as any })}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-primary appearance-none cursor-pointer"
                        >
                            <option value="ECONOMY">Economy</option>
                            <option value="COMFORT">Comfort</option>
                            <option value="XL">XL (6+ Lugares)</option>
                            <option value="BIKE">Mota</option>
                            <option value="TRUCK">Camião</option>
                        </select>
                    </div>
                    <div className="md:col-span-4 flex justify-end">
                        <Button type="submit" className="font-bold">
                            {editingVehicle ? 'Atualizar Veículo' : 'Salvar Veículo'}
                        </Button>
                    </div>
                </form>
            )}

            {vehicles.length === 0 ? (
                <div className="text-center p-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center">
                    <Car size={48} className="mb-4 opacity-10" />
                    <p className="text-gray-500 font-medium">Nenhum veículo registado nesta frota.</p>
                    {!showAddForm && (
                        <Button variant="link" onClick={() => setShowAddForm(true)} className="mt-2 text-primary font-bold">
                            Adicionar o primeiro veículo agora
                        </Button>
                    )}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 text-[10px] uppercase font-black text-gray-400 tracking-widest">
                                <th className="px-4 py-3">Veículo</th>
                                <th className="px-4 py-3">Matrícula</th>
                                <th className="px-4 py-3">Tipo</th>
                                <th className="px-4 py-3 text-right">Acções</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {vehicles.map((v) => (
                                <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-4">
                                        <div className="font-bold text-gray-900">{v.model}</div>
                                        <div className="text-[10px] text-gray-400">{v.year}</div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="bg-gray-100 px-3 py-1 rounded-md font-mono font-bold text-xs border border-gray-200">
                                            {v.plate}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded-full border border-primary/10">
                                            {v.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-400 hover:text-primary" onClick={() => handleEditClick(v)}>
                                                <Edit size={16} />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-400 hover:text-red-500" onClick={() => handleDeleteVehicle(v.id)}>
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
