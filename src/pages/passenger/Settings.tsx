import { useState, useEffect } from 'react';
import { ArrowLeft, Moon, Bell, Globe, Shield, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { useTripStore } from '../../stores/useTripStore';

export default function PassengerSettings() {
    const navigate = useNavigate();
    const { logout } = useTripStore();

    // Persistent Settings
    const [darkMode, setDarkMode] = useState(() => JSON.parse(localStorage.getItem('settings_dark_mode') || 'false'));
    const [notifications, setNotifications] = useState(() => JSON.parse(localStorage.getItem('settings_notifications') || 'true'));

    useEffect(() => {
        localStorage.setItem('settings_dark_mode', JSON.stringify(darkMode));
        // In a real app, apply class to body
    }, [darkMode]);

    useEffect(() => {
        localStorage.setItem('settings_notifications', JSON.stringify(notifications));
    }, [notifications]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white p-4 pt-safe shadow-sm flex items-center gap-4 sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </Button>
                <h1 className="text-xl font-bold">Definições</h1>
            </header>

            <main className="flex-1 p-4 space-y-6">

                {/* App Preferences */}
                <section>
                    <h2 className="text-xs font-bold text-gray-500 mb-3 px-2 uppercase tracking-wider">Preferências da App</h2>
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between p-4 border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <Moon size={18} />
                                </div>
                                <span className="font-medium text-gray-900">Modo Escuro</span>
                            </div>
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-primary' : 'bg-gray-200'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${darkMode ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                                    <Bell size={18} />
                                </div>
                                <span className="font-medium text-gray-900">Notificações</span>
                            </div>
                            <button
                                onClick={() => setNotifications(!notifications)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? 'bg-primary' : 'bg-gray-200'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${notifications ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Globe size={18} />
                                </div>
                                <span className="font-medium text-gray-900">Idioma</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                <span className="text-sm">Português (MZ)</span>
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Legal & Security */}
                <section>
                    <h2 className="text-xs font-bold text-gray-500 mb-3 px-2 uppercase tracking-wider">Legal e Segurança</h2>
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate('/terms')}>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                                    <Shield size={18} />
                                </div>
                                <span className="font-medium text-gray-900">Privacidade e Termos</span>
                            </div>
                            <ChevronRight size={16} className="text-gray-400" />
                        </div>
                    </div>
                </section>

                <div className="pt-8">
                    <Button variant="outline" className="w-full text-red-500 border-red-100 hover:bg-red-50 h-14 font-bold" onClick={logout}>
                        Terminar Sessão
                    </Button>
                    <p className="text-center text-xs text-gray-300 mt-4">Versão 1.0.0 (Build 2025)</p>
                </div>

            </main>
        </div>
    );
}
