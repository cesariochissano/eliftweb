import { useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { User, Car, Truck } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

export default function RoleSelection() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState<'PASSENGER' | 'DRIVER' | 'FLEET_MANAGER' | null>(null);

    const handleContinue = async () => {
        if (!selectedRole) return;

        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Utilizador não autenticado');

            const { error } = await supabase
                .from('profiles')
                .update({ role: selectedRole })
                .eq('id', user.id);

            if (error) throw error;

            if (selectedRole === 'PASSENGER') {
                navigate('/home');
            } else if (selectedRole === 'DRIVER') {
                navigate('/driver/dashboard');
            } else {
                navigate('/fleet/dashboard');
            }
        } catch (error: any) {
            console.error('Error saving role:', error);
            alert('Erro ao guardar a função: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const RoleCard = ({ id, icon: Icon, title, desc }: any) => (
        <button
            onClick={() => setSelectedRole(id)}
            className={cn(
                "flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all w-full aspect-square",
                selectedRole === id
                    ? "border-primary bg-primary/5 shadow-md scale-105"
                    : "border-gray-100 bg-white hover:bg-gray-50"
            )}
        >
            <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors",
                selectedRole === id ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
            )}>
                <Icon size={32} />
            </div>
            <h3 className="font-bold text-lg text-text-main">{title}</h3>
            <p className="text-xs text-text-muted text-center mt-1">{desc}</p>
        </button>
    );

    return (
        <div className="min-h-screen bg-white flex flex-col p-6 pb-safe">
            <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
                <h1 className="text-2xl font-extrabold text-center mb-2">
                    Como quer usar o eLift?
                </h1>
                <p className="text-text-muted text-center mb-8">
                    Escolha o seu perfil principal. Pode adicionar outros mais tarde.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="col-span-2">
                        <RoleCard
                            id="PASSENGER"
                            icon={User}
                            title="Passageiro"
                            desc="Quero viajar ou enviar encomendas"
                        />
                    </div>
                    <RoleCard
                        id="DRIVER"
                        icon={Car}
                        title="Motorista"
                        desc="Quero conduzir e ganhar"
                    />
                    <RoleCard
                        id="FLEET_MANAGER"
                        icon={Truck}
                        title="Frotista"
                        desc="Gerir veículos e motoristas"
                    />
                </div>

                <Button
                    size="lg"
                    className="w-full mt-auto"
                    disabled={!selectedRole || isLoading}
                    onClick={handleContinue}
                >
                    {isLoading ? 'A guardar...' : 'Continuar'}
                </Button>
            </div>
        </div>
    );
}
