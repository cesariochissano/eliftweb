import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, FileText, CheckCircle, Loader2, Car, Users, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { supabase } from '../../lib/supabase';

export default function DriverDocuments() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);
    const [inviteCode, setInviteCode] = useState('');
    const [joiningFleet, setJoiningFleet] = useState(false);

    // Setup State for specific fields instead of generic object to handle easier
    const [vehicleMake, setVehicleMake] = useState('');
    const [vehicleModel, setVehicleModel] = useState('');
    const [vehiclePlate, setVehiclePlate] = useState('');
    const [vehicleColor, setVehicleColor] = useState('');


    const [documents, setDocuments] = useState({
        license_url: null,
        id_card_url: null,
        vehicle_photo_url: null, // New
        status: 'PENDING',
        fleet_id: null
    });

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('drivers')
                .select('license_url, id_card_url, document_status, vehicle_make, vehicle_model, vehicle_plate, vehicle_color, vehicle_photo_url, fleet_id')
                .eq('id', user.id)
                .single();
            if (data) {
                setDocuments({
                    license_url: data.license_url,
                    id_card_url: data.id_card_url,
                    vehicle_photo_url: data.vehicle_photo_url,
                    status: data.document_status || 'PENDING',
                    fleet_id: data.fleet_id
                });
                setVehicleMake(data.vehicle_make || '');
                setVehicleModel(data.vehicle_model || '');
                setVehiclePlate(data.vehicle_plate || '');
                setVehicleColor(data.vehicle_color || '');
            }
        }
        setLoading(false);
    };

    const handleUpload = async (file: File, type: 'license' | 'id_card' | 'vehicle_photo') => {
        setUploading(type);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Sanitize filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(fileName);

            // Update Database
            let updates: any = {};
            if (type === 'license') updates = { license_url: publicUrl };
            else if (type === 'id_card') updates = { id_card_url: publicUrl };
            else if (type === 'vehicle_photo') updates = { vehicle_photo_url: publicUrl };

            await supabase.from('drivers').update({
                ...updates,
                document_status: 'PENDING'
            }).eq('id', user.id);

            setDocuments(prev => ({ ...prev, ...updates, status: 'PENDING' }));

        } catch (error: any) {
            console.error('Error uploading:', error);
            alert('Erro ao enviar documento. Tente novamente.');
        } finally {
            setUploading(null);
        }
    };

    const saveVehicleDetails = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('drivers').update({
            vehicle_make: vehicleMake,
            vehicle_model: vehicleModel,
            vehicle_plate: vehiclePlate,
            vehicle_color: vehicleColor,
            document_status: 'PENDING'
        }).eq('id', user.id);

        if (error) alert('Erro ao salvar dados do veículo.');
        else alert('Dados do veículo salvos com sucesso!');
    };

    const joinFleet = async () => {
        if (!inviteCode || inviteCode.length < 3) {
            alert('Código inválido');
            return;
        }
        setJoiningFleet(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Find Fleet by Invite Code (assuming invite_code column on fleets)
            const { data: fleet, error: fleetError } = await supabase
                .from('fleets')
                .select('id, name')
                .eq('invite_code', inviteCode.toUpperCase())
                .single();

            if (fleetError || !fleet) {
                alert('Frota não encontrada com este código.');
                setJoiningFleet(false);
                return;
            }

            // Update Driver
            const { error: updateError } = await supabase
                .from('drivers')
                .update({ fleet_id: fleet.id })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setDocuments(prev => ({ ...prev, fleet_id: fleet.id }));
            alert(`Você entrou na frota ${fleet.name} com sucesso!`);

        } catch (err) {
            console.error(err);
            alert('Erro ao entrar na frota.');
        } finally {
            setJoiningFleet(false);
        }
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="animate-spin text-primary" size={32} />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white p-4 pt-safe shadow-sm flex items-center gap-4 sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </Button>
                <h1 className="text-xl font-bold">Configuração do Motorista</h1>
            </header>

            <main className="flex-1 p-6 space-y-8 pb-10">

                {/* 1. DOCUMENTS */}
                <section>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <FileText className="text-primary" size={20} />
                        Documentação
                    </h2>
                    <div className="space-y-4">
                        {/* Driver License */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-start justify-between mb-4">
                                <div className="ml-1">
                                    <h3 className="font-bold text-gray-900">Carta de Condução</h3>
                                    <p className="text-xs text-gray-500">Frente e Verso</p>
                                </div>
                                {documents.license_url && <CheckCircle className="text-green-500" size={20} />}
                            </div>
                            {documents.license_url ? (
                                <a href={documents.license_url} target="_blank" className="text-xs text-primary font-bold underline mb-3 block">Ver Enviado</a>
                            ) : null}
                            <div className="relative">
                                <input type="file" accept="image/*,.pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'license')} disabled={uploading === 'license'} />
                                <Button variant="outline" className="w-full h-12 border-dashed gap-2">
                                    {uploading === 'license' ? <Loader2 className="animate-spin" /> : <Upload size={16} />}
                                    {documents.license_url ? 'Reenviar' : 'Carregar Carta'}
                                </Button>
                            </div>
                        </div>

                        {/* ID Card */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-start justify-between mb-4">
                                <div className="ml-1">
                                    <h3 className="font-bold text-gray-900">Bilhete de Identidade</h3>
                                    <p className="text-xs text-gray-500">Documento de Identificação</p>
                                </div>
                                {documents.id_card_url && <CheckCircle className="text-green-500" size={20} />}
                            </div>
                            {documents.id_card_url ? (
                                <a href={documents.id_card_url} target="_blank" className="text-xs text-primary font-bold underline mb-3 block">Ver Enviado</a>
                            ) : null}
                            <div className="relative">
                                <input type="file" accept="image/*,.pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'id_card')} disabled={uploading === 'id_card'} />
                                <Button variant="outline" className="w-full h-12 border-dashed gap-2">
                                    {uploading === 'id_card' ? <Loader2 className="animate-spin" /> : <Upload size={16} />}
                                    {documents.id_card_url ? 'Reenviar' : 'Carregar BI'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. VEHICLE DETAILS */}
                <section>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Car className="text-primary" size={20} />
                        Dados do Veículo
                    </h2>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 ml-1">Marca</label>
                                <Input placeholder="Ex: Toyota" value={vehicleMake} onChange={e => setVehicleMake(e.target.value)} className="bg-gray-50" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 ml-1">Modelo</label>
                                <Input placeholder="Ex: Ractis" value={vehicleModel} onChange={e => setVehicleModel(e.target.value)} className="bg-gray-50" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 ml-1">Matrícula</label>
                                <Input placeholder="ABC 123 MC" value={vehiclePlate} onChange={e => setVehiclePlate(e.target.value)} className="bg-gray-50" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 ml-1">Cor</label>
                                <Input placeholder="Ex: Cinza" value={vehicleColor} onChange={e => setVehicleColor(e.target.value)} className="bg-gray-50" />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 ml-1 mb-2 block">Foto do Veículo</label>
                            <div className="relative">
                                <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'vehicle_photo')} disabled={uploading === 'vehicle_photo'} />
                                <div className={`w-full h-32 rounded-xl border-2 border-dashed flex items-center justify-center flex-col gap-2 transition-colors ${documents.vehicle_photo_url ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                                    {documents.vehicle_photo_url ? (
                                        <>
                                            <CheckCircle className="text-green-500" size={24} />
                                            <span className="text-xs font-bold text-green-700">Foto Carregada</span>
                                        </>
                                    ) : (
                                        <>
                                            {uploading === 'vehicle_photo' ? <Loader2 className="animate-spin text-gray-400" /> : <Camera className="text-gray-400" size={24} />}
                                            <span className="text-xs text-gray-400 font-medium">Toque para carregar foto</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Button className="w-full mt-2" onClick={saveVehicleDetails}>
                            Salvar Dados do Veículo
                        </Button>
                    </div>
                </section>

                {/* 3. FLEET ASSOCIATION */}
                <section>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Users className="text-primary" size={20} />
                        Associação de Frota
                    </h2>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        {documents.fleet_id ? (
                            <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-center gap-3">
                                <CheckCircle className="text-green-500" size={24} />
                                <div>
                                    <p className="font-bold text-green-800">Associado à Frota</p>
                                    <p className="text-xs text-green-600">Você já faz parte de uma frota.</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-gray-500 mb-4">Se você trabalha para uma frota, peça o código de convite ao gestor e insira abaixo.</p>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Código da Frota (Ex: ELIFT-99)"
                                        value={inviteCode}
                                        onChange={e => setInviteCode(e.target.value)}
                                        className="uppercase tracking-widest font-bold"
                                    />
                                    <Button onClick={joinFleet} disabled={joiningFleet}>
                                        {joiningFleet ? <Loader2 className="animate-spin" /> : 'Entrar'}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </section>

            </main>
        </div>
    );
}
