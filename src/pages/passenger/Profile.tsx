import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, User, Mail, Phone, Camera, Save, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export default function PassengerProfile() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) setProfile(data);
            setLoading(false);
        };

        fetchProfile();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMsg(null);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    first_name: profile.first_name,
                    last_name: profile.last_name,
                    email: profile.email
                })
                .eq('id', profile.id);

            if (error) throw error;
            setMsg({ type: 'success', text: 'Perfil atualizado com sucesso!' });
        } catch (err) {
            console.error(err);
            setMsg({ type: 'error', text: 'Erro ao atualizar perfil.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <header className="bg-white p-4 pt-safe shadow-sm flex items-center gap-4 sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </Button>
                <h1 className="text-xl font-bold">Meu Perfil</h1>
            </header>

            <main className="flex-1 p-6">
                <div className="flex flex-col items-center mb-8">
                    <div className="relative group cursor-pointer">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={40} className="text-gray-400" />
                            )}
                        </div>
                        <label htmlFor="file-upload" className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-md hover:bg-green-600 transition-colors cursor-pointer">
                            <Camera size={16} />
                        </label>
                        <input
                            id="file-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file || !profile) return;

                                setSaving(true);
                                try {
                                    const fileExt = file.name.split('.').pop();
                                    const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
                                    const { error: uploadError } = await supabase.storage
                                        .from('avatars')
                                        .upload(fileName, file, { upsert: true });

                                    if (uploadError) throw uploadError;

                                    const { data: { publicUrl } } = supabase.storage
                                        .from('avatars')
                                        .getPublicUrl(fileName);

                                    // Add timestamp to force string change
                                    const publicUrlWithParams = `${publicUrl}?t=${new Date().getTime()}`;

                                    const { error: updateError } = await supabase
                                        .from('profiles')
                                        .update({ avatar_url: publicUrlWithParams })
                                        .eq('id', profile.id);

                                    if (updateError) throw updateError;
                                    setProfile({ ...profile, avatar_url: publicUrlWithParams });
                                    setMsg({ type: 'success', text: 'Foto atualizada!' });
                                } catch (error: any) {
                                    console.error(error);
                                    setMsg({ type: 'error', text: 'Erro ao carregar foto.' });
                                } finally {
                                    setSaving(false);
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    {msg && (
                        <div className={`p-4 rounded-xl text-sm font-bold text-center ${msg.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {msg.text}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Nome</label>
                            <Input
                                value={profile?.first_name || ''}
                                onChange={e => setProfile({ ...profile, first_name: e.target.value })}
                                className="bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Sobrenome</label>
                            <Input
                                value={profile?.last_name || ''}
                                onChange={e => setProfile({ ...profile, last_name: e.target.value })}
                                className="bg-gray-50"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Telemóvel</label>
                        <div className="relative">
                            <Input
                                value={profile?.phone || ''}
                                disabled
                                className="bg-gray-100 text-gray-500 pl-10"
                            />
                            <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 pl-1">O número de telemóvel não pode ser alterado.</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Email</label>
                        <div className="relative">
                            <Input
                                value={profile?.email || ''}
                                onChange={e => setProfile({ ...profile, email: e.target.value })}
                                className="bg-gray-50 pl-10"
                            />
                            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>

                    {/* Admin Access Button - Only for Super Admin */}
                    {profile?.email === 'admin@elift.com' && (
                        <Button
                            className="w-full h-14 bg-gray-900 text-white font-bold gap-2 mt-4 hover:bg-black"
                            onClick={() => navigate('/admin')}
                        >
                            <Users size={20} />
                            Painel Super Admin
                        </Button>
                    )}

                    <Button className="w-full h-14 text-lg font-bold gap-2 mt-8" onClick={handleSave} disabled={saving}>
                        {saving ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <Save size={20} />}
                        Guardar Alterações
                    </Button>
                </div>
            </main>
        </div>
    );
}
