import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase';

export default function OTPVerify() {
    const navigate = useNavigate();
    const location = useLocation();
    const phone = location.state?.phone;
    const [otp, setOtp] = useState(['', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto focus next
        if (value && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const token = otp.join('');
        if (token.length !== 4) return;

        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.verifyOtp({
                phone: phone,
                token: token,
                type: 'sms',
            });

            if (error) throw error;

            console.log('Login success:', data);

            // The session is now handled by Supabase, AuthProvider will detect it
            navigate('/');
        } catch (error: any) {
            console.error('Error verifying OTP:', error);
            alert(error.message || 'Código inválido.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        inputRefs.current[0]?.focus();
        if (!phone) {
            // Redirect back if no phone
            navigate('/auth/login');
        }
    }, [phone, navigate]);

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

                <div className="flex-1">
                    <h1 className="text-3xl font-extrabold text-text-main mb-2">
                        Verifique o código
                    </h1>
                    <p className="text-text-muted text-sm mb-8">
                        Enviamos um código de 4 dígitos para <span className="font-bold text-text-main">{phone}</span>
                    </p>

                    <div className="flex gap-4 justify-between mb-8 max-w-[280px]">
                        {otp.map((digit, i) => (
                            <input
                                key={i}
                                ref={(el) => { inputRefs.current[i] = el }}

                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                className="w-14 h-16 rounded-2xl border-2 border-gray-100 text-center text-2xl font-bold focus:border-primary focus:ring-0 focus:outline-none transition-all placeholder:text-gray-200 bg-gray-50"
                                placeholder="-"
                            />
                        ))}
                    </div>

                    <p className="text-sm font-medium text-text-muted mb-8">
                        Não recebeu? <span className="text-primary cursor-pointer hover:underline">Reenviar em 20s</span>
                    </p>
                    <Button onClick={handleVerify} size="lg" className="w-full" disabled={otp.some(d => !d) || isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Verificar'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
