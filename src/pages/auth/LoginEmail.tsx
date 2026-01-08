import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Loader2, ArrowLeft, Lock } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { supabase } from '../../lib/supabase';

export default function LoginEmail() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;

        setIsLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            // Redirect is handled by AuthProvider typically, or we can force it
            // The user mentioned "Poderão iniciar secção...". Default Auth listener in App.tsx should handle redirect.
            // But let's verify if we need to do anything here. 
            // Usually signInWithPassword auto-updates session.

        } catch (error: any) {
            console.error('Error login:', error);
            setMessage({
                type: 'error',
                text: error.message || 'Erro ao entrar. Verifique suas credenciais.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/`
                }
            });
            if (error) throw error;
        } catch (error: any) {
            console.error('Error Google login:', error);
            alert(error.message || 'Erro ao entrar com Google');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col relative px-6 py-8 pb-safe">
            <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
                <header className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 text-text-main hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Voltar"
                    >
                        <ArrowLeft size={24} />
                    </button>
                </header>

                <div className="flex-1 flex flex-col justify-center">
                    <div className="mb-8">
                        <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold mb-4">
                            Acesso por E-mail
                        </span>
                        <h1 className="text-3xl font-extrabold text-text-main mb-2">
                            Bem-vindo de volta
                        </h1>
                        <p className="text-text-muted text-sm">
                            Escolha como deseja aceder à sua conta eLift.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            className="w-full border-gray-200 h-14"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                        >
                            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Continuar com Google
                        </Button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-100"></span>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-4 text-text-muted font-medium">Ou use um Link Mágico</span>
                            </div>
                        </div>

                        <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
                            <Input
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-14 text-lg"
                                required
                                icon={<Mail className="text-gray-400" size={20} />}
                            />

                            <Input
                                type="password"
                                placeholder="Palavra-passe"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-14 text-lg"
                                required
                                icon={<Lock className="text-gray-400" size={20} />}
                            />

                            {message && (
                                <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    {message.text}
                                </div>
                            )}

                            <Button type="submit" size="lg" className="h-14 group" disabled={!email || !password || isLoading}>
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                                    <>
                                        Entrar
                                        <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                                    </>
                                )}
                            </Button>
                        </form>

                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="mt-4 text-sm font-bold text-primary hover:underline"
                        >
                            Voltar para Telefone
                        </button>
                    </div>
                </div>
                <p className="text-center text-xs text-text-muted mt-8">
                    Ao continuar, concorda com os nossos <a href="#" className="underline">Termos de Serviço</a> e <a href="#" className="underline">Política de Privacidade</a>.
                </p>
            </div>
        </div>
    );
}
