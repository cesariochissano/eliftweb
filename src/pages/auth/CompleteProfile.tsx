import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Camera, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { supabase } from '../../lib/supabase';

export default function CompleteProfile() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/');
                return;
            }

            // Pre-fill from social meta if available
            const metadata = user.user_metadata;
            if (metadata) {
                if (metadata.full_name && !firstName) {
                    const names = metadata.full_name.split(' ');
                    setFirstName(names[0] || '');
                    setLastName(names.slice(1).join(' ') || '');
                } else if (metadata.name && !firstName) {
                    setFirstName(metadata.name);
                }

                if (metadata.avatar_url && !avatarUrl) {
                    setAvatarUrl(metadata.avatar_url);
                }

                if (user.email && !email) {
                    setEmail(user.email);
                }
            }

            // Check if phone available from sms login
            if (user.phone && !phone) {
                setPhone(user.phone.replace('+258', ''));
            }

            setFetching(false);
        };

        fetchUserData();
    }, [navigate]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Utilizador não encontrado');

            // Upsert profile
            const { error } = await supabase.from('profiles').upsert({
                id: user.id,
                first_name: firstName,
                last_name: lastName,
                phone: `+258${phone.replace(/\s/g, '')}`,
                email: email,
                avatar_url: avatarUrl
            });

            if (error) {
                console.warn('Database save failed, but checking if we can proceed:', error);
                throw error;
            }

            navigate('/auth/role');
        } catch (err: any) {
            console.error('Error saving profile:', err);
            alert(err.message || 'Erro ao guardar perfil');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col px-6 py-8 pb-safe">
            <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-text-main mb-2">
                        Complete o seu perfil
                    </h1>
                    <p className="text-text-muted text-sm">
                        Conte-nos um pouco sobre si para começar a usar o eLift.
                    </p>
                </div>

                <form onSubmit={handleSave} className="space-y-6 flex-1 flex flex-col">
                    {/* Avatar Upload Placeholder */}
                    <div className="flex justify-center mb-4">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-50">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={40} className="text-gray-400" />
                                )}
                            </div>
                            <button
                                type="button"
                                className="absolute bottom-0 right-0 w-8 h-8 bg-black rounded-full flex items-center justify-center text-white border-2 border-white"
                                aria-label="Alterar foto"
                            >
                                <Camera size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-text-main ml-1">Nome</label>
                            <Input
                                placeholder="João"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-text-main ml-1">Apelido</label>
                            <Input
                                placeholder="Silva"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-text-main ml-1">Telefone</label>
                        <div className="flex gap-3">
                            <div className="shrink-0 h-14 w-16 flex items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold text-gray-600">
                                +258
                            </div>
                            <Input
                                placeholder="84 123 4567"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                className="flex-1"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-text-main ml-1">E-mail (Opcional)</label>
                        <Input
                            placeholder="joao@exemplo.com"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="flex-1" />

                    <Button type="submit" size="lg" className="w-full group mb-4" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                            <>
                                Concluir Perfil
                                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                            </>
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}
