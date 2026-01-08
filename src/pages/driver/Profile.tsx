import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, User, Mail, Phone, Car, Star, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';


export default function DriverProfile() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [fleet, setFleet] = useState<any>(null);
    const [inviteCode, setInviteCode] = useState('');
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: pData } = await supabase.from('profiles').select('*, fleets(name, type)').eq('id', user.id).single();

            if (pData) {
                setProfile(pData);
                if (pData.fleets) {
                    setFleet(pData.fleets);
                }
            }
            setLoading(false);
        };

        fetchProfile();
    }, []);

    const handleJoinFleet = async () => {
        if (!inviteCode) return;
        setJoining(true);

        try {
            // 1. Validate Code
            const { data: fleetData, error: fleetError } = await supabase
                .from('fleets')
                .select('id, name, type')
                .eq('invite_code', inviteCode.toUpperCase().trim())
                .single();

            if (fleetError || !fleetData) {
                alert("Código de convite inválido ou expirado.");
                return;
            }

            // 2. Update Driver
            const { error: updateError } = await supabase
                .from('drivers')
                .update({ fleet_id: fleetData.id })
                .eq('id', profile.id);

            if (updateError) throw updateError;

            // 3. Update Local State
            setFleet(fleetData);
            alert(`Bem-vindo à frota ${fleetData.name}!`);
            setInviteCode('');
        } catch (error) {
            console.error(error);
            alert("Erro ao vincular à frota.");
        } finally {
            setJoining(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <header className="bg-white p-4 pt-safe shadow-sm flex items-center gap-4 sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </Button>
                <h1 className="text-xl font-bold">Perfil Motorista</h1>
            </header>

            <main className="flex-1 p-6">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-24 h-24 bg-gray-900 text-white rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-lg mb-4">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User size={40} />
                        )}
                    </div>
                    <h2 className="text-xl font-bold">{profile?.first_name} {profile?.last_name}</h2>
                    <div className="flex items-center gap-1 mt-1">
                        <Star size={16} className="text-yellow-500 fill-current" />
                        <span className="font-bold">4.92</span>
                        <span className="text-gray-400 mx-1">•</span>
                        <span className="text-gray-500">Motorista Elite</span>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Status Card */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <div className="font-bold text-blue-900">Conta Verificada</div>
                            <div className="text-xs text-blue-700">Todos os documentos estão em dia.</div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase">Informações Pessoais</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 mb-1">Telemóvel</label>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 text-gray-600">
                                    <Phone size={18} />
                                    <span className="font-medium">{profile?.phone}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 mb-1">Email</label>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 text-gray-600">
                                    <Mail size={18} />
                                    <span className="font-medium">{profile?.email || 'Não definido'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase">Veículo Ativo</h3>
                        <div className="bg-gray-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
                            <div className="absolute right-[-20px] top-[20px] opacity-10">
                                <Car size={150} />
                            </div>
                            <div className="relative z-10">
                                <div className="text-sm text-gray-400 mb-1">Toyota Ractis</div>
                                <div className="text-2xl font-bold mb-4">ABC 123 MC</div>
                                <div className="flex gap-4">
                                    <div>
                                        <div className="text-[10px] text-gray-400 uppercase">Cor</div>
                                        <div className="font-bold">Prata</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-400 uppercase">Ano</div>
                                        <div className="font-bold">2015</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Gestão de Frota</h3>
                        {fleet ? (
                            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900">{fleet.name}</div>
                                        <div className="text-[10px] text-primary font-black uppercase tracking-widest">
                                            {fleet.type === 'CORPORATE' ? 'Frota Empresarial' : 'Frota Individual'}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 leading-relaxed">
                                    {fleet.type === 'CORPORATE'
                                        ? "Como motorista de frota empresarial, a sua performance é gerida centralmente e o seu saldo é processado pela empresa."
                                        : "Você está vinculado a uma frota individual. A gestão de parcerias e pagamentos é feita directamente com o proprietário."}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                                <p className="text-xs text-gray-500 mb-4">
                                    Se você faz parte de uma frota, insira o código de convite abaixo para se vincular.
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="FLEET-XXXX"
                                        value={inviteCode}
                                        onChange={(e) => setInviteCode(e.target.value)}
                                        className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal outline-none focus:border-primary"
                                    />
                                    <Button
                                        onClick={handleJoinFleet}
                                        disabled={joining || !inviteCode}
                                        size="sm"
                                        className="font-bold"
                                    >
                                        {joining ? '...' : 'Vincular'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
