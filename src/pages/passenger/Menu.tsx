import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Pencil, ChevronRight, LogOut } from 'lucide-react'; // Using Lucide icons as placeholders for now

export default function Menu() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        getProfile();
    }, []);

    const getProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setProfile(data || {});
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const menuItems = [
        { label: 'HISTÓRICO DE VIAGENS', path: '/passenger/trips' },
        { label: 'CARTEIRA', path: '/passenger/wallet' },
        { label: 'CÓDIGO PROMOCIONAL', path: '/passenger/promotions' },
        { label: 'SUPORTE', path: '/passenger/support' },
        { label: 'DEFINIÇÕES', path: '/passenger/settings' },
    ];

    // Se for Admin, adicionamos o atalho no topo
    if (profile?.role === 'SUPER_ADMIN' || profile?.role === 'SERVICE_ADMIN') {
        menuItems.unshift({ label: '🛡️ PAINEL ADMIN', path: '/admin' });
    }

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            {/* Header Section - Black Background with Green Accents */}
            <div className="bg-[#101b0d] pt-safe pb-10 px-6 flex flex-col items-center relative rounded-b-[2.5rem] shadow-sm">

                {/* Avatar */}
                <div className="relative mb-4 mt-8">
                    <div className="w-28 h-28 rounded-full bg-gray-800 border-4 border-[#101b0d] overflow-hidden shadow-lg flex items-center justify-center ring-2 ring-primary/20">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-4xl font-bold text-primary">{profile?.first_name?.[0] || 'U'}</span>
                        )}
                    </div>
                    <button
                        onClick={() => navigate('/passenger/profile')}
                        className="absolute top-0 right-0 bg-primary text-black p-2 rounded-full shadow-md hover:bg-primary-dark transition-colors"
                    >
                        <Pencil size={16} />
                    </button>
                </div>

                {/* User Info */}
                <h1 className="text-2xl font-bold text-white mb-1 capitalize">
                    {profile?.first_name} {profile?.last_name}
                </h1>
                <p className="text-gray-400 text-sm font-medium">
                    {profile?.email || 'email@exemplo.com'}
                </p>
            </div>

            {/* Menu List */}
            <div className="flex-1 px-6 py-8">
                <div className="flex flex-col gap-4">
                    {menuItems.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => navigate(item.path)}
                            className="group flex items-center justify-between w-full p-5 hover:bg-gray-50 rounded-2xl transition-all duration-200 border border-transparent hover:border-gray-100 bg-white shadow-sm hover:shadow-md"
                        >
                            <span className="text-sm font-bold tracking-widest uppercase text-[#121212]">
                                {item.label}
                            </span>

                            <div className="flex items-center gap-3">
                                <ChevronRight size={20} className="text-gray-300 group-hover:text-primary transition-colors" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Sign Out - Bottom */}
            <div className="p-8 pb-safe mt-auto">
                <button
                    onClick={handleSignOut}
                    className="flex items-center justify-center gap-2 w-full text-red-500 font-bold text-sm hover:bg-red-50 p-4 rounded-xl transition-all"
                >
                    <LogOut size={18} />
                    Terminar Sessão
                </button>
            </div>
        </div>
    );
}
