import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Phone } from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function ReportAccident() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white font-sans flex flex-col">
            {/* Header */}
            <div className="bg-white pt-safe pb-4 px-4 flex items-center justify-between sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
                    <ChevronLeft size={24} className="text-black" />
                </button>
                <h1 className="text-lg font-bold text-black">Relatar Acidente</h1>
                <div className="w-10" />
            </div>

            {/* Content */}
            <div className="flex-1 px-6 pt-6 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                        <Phone size={32} className="text-white" />
                    </div>
                </div>

                <h2 className="text-2xl font-black text-gray-900 mb-4">Esteve num acidente?</h2>
                <p className="text-gray-500 mb-8 max-w-sm">
                    A sua segurança é a nossa prioridade. Se você ou alguém estiver ferido, por favor, contacte os serviços de emergência imediatamente.
                </p>

                <div className="w-full space-y-4">
                    <a href="tel:112" className="block w-full">
                        <Button className="w-full h-16 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-lg shadow-xl shadow-red-500/20 flex items-center justify-center gap-3">
                            <Phone size={24} />
                            Ligar Para Emergência (112)
                        </Button>
                    </a>

                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-100" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-gray-400 font-bold">ou</span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full h-14 rounded-2xl border-2 border-gray-100 font-bold hover:bg-gray-50"
                        onClick={() => navigate('/passenger/contact', { state: { reportType: 'accident', initialSubject: 'Relato de Acidente' } })}
                    >
                        Reportar ao Suporte eLift
                    </Button>
                </div>
            </div>
        </div>
    );
}
