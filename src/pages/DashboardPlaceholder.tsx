import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';


export default function DashboardPlaceholder({ title }: { title: string }) {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-2xl font-bold mb-4">{title}</h1>
            <p className="text-text-muted mb-8">Esta funcionalidade será implementada na próxima fase.</p>
            <Button variant="outline" onClick={() => navigate('/auth/role')}>
                Voltar para Seleção de Perfil
            </Button>
        </div>
    );
}
