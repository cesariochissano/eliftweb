import { useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { Phone, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { supabase } from '../../lib/supabase';

export default function LoginPhone() {
    const navigate = useNavigate();
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleContinue = async (e: React.FormEvent) => {
        e.preventDefault();
        if (phone.length < 8) return;

        setIsLoading(true);
        // Format phone: +258 + number (remove spaces)
        const formattedPhone = `+258${phone.replace(/\s/g, '')}`;

        try {
            const { error } = await supabase.auth.signInWithOtp({
                phone: formattedPhone,
            });

            if (error) throw error;

            navigate('/auth/otp', { state: { phone: formattedPhone } });
        } catch (error: any) {
            console.error('Error sending OTP:', error);
            alert(error.message || 'Erro ao enviar código. Verifique o número.');
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



    const goToEmailLogin = () => {
        navigate('/auth/login-email');
    };

    return (
        <div className="min-h-screen bg-white flex flex-col relative px-6 py-8 pb-safe">
            <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
                <div className="mb-8">
                    <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold mb-4">
                        eLift Moçambique
                    </span>
                    <h1 className="text-3xl font-extrabold text-text-main mb-2">
                        Vamos começar!
                    </h1>
                    <p className="text-text-muted text-sm leading-relaxed">
                        Insira seu número para <strong>entrar</strong> ou <strong>criar uma conta</strong> nova.
                    </p>
                </div>

                <form onSubmit={handleContinue} className="flex flex-col gap-6">
                    <div className="flex gap-3">
                        <div className="shrink-0 h-14 w-20 flex items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold text-gray-600">
                            +258
                        </div>
                        <Input
                            type="tel"
                            placeholder="84 123 4567"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="flex-1 text-lg font-medium tracking-wide"
                            autoFocus
                            icon={<Phone className="text-gray-400" size={20} />}
                        />
                    </div>

                    <Button type="submit" size="lg" className="w-full group" disabled={phone.length < 8 || isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                            <>
                                Continuar com Telefone
                                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                            </>
                        )}
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        size="lg"
                        className="w-full text-primary font-bold"
                        onClick={goToEmailLogin}
                        disabled={isLoading}
                    >
                        Entrar com E-mail
                    </Button>

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-100"></span>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-4 text-text-muted font-medium">Ou continuar com</span>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="w-full border-gray-200"
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
                        Google
                    </Button>

                    <div className="mt-8">
                        {/* Demo Access Removed */}
                    </div>
                </form>
            </div>

            <p className="text-center text-xs text-text-muted mt-8">
                Ao continuar, concorda com os nossos <a href="#" className="underline">Termos de Serviço</a> e <a href="#" className="underline">Política de Privacidade</a>.
            </p>
        </div>
    );
}
