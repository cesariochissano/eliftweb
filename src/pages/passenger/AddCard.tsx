import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera, ScanFace, CreditCard } from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function AddCard() {
    const navigate = useNavigate();
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');

    const handleSave = () => {
        if (!cardNumber || !cardName || !expiry || !cvv) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        const newCard = {
            id: Date.now().toString(),
            number: cardNumber,
            name: cardName,
            expiry,
            type: cardNumber.startsWith('4') ? 'Visa' : 'Mastercard' // Simple mock detection
        };

        const existing = JSON.parse(localStorage.getItem('saved_cards') || '[]');
        localStorage.setItem('saved_cards', JSON.stringify([...existing, newCard]));

        navigate(-1);
    };

    return (
        <div className="min-h-screen bg-white font-sans flex flex-col">
            {/* Header */}
            <div className="bg-white pt-safe pb-4 px-4 flex items-center justify-between sticky top-0 z-10 transition-shadow">
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
                    <ChevronLeft size={24} className="text-black" />
                </button>
                <h1 className="text-lg font-extrabold text-[#101b0d]">Adicionar cartão</h1>
                <div className="w-10" />
            </div>

            <div className="flex-1 px-6 pt-6">

                {/* Visual Card Preview (Optional based on image 2 style) */}
                <div className="mb-8 p-6 bg-[#2c3e50] rounded-2xl text-white shadow-xl relative overflow-hidden h-48 flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                    <div className="flex justify-between items-start z-10">
                        <div>
                            <p className="text-[10px] opacity-70 uppercase tracking-widest">Card Number</p>
                            <p className="font-mono text-lg tracking-widest">{cardNumber || '**** **** **** ****'}</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="w-8 h-8 rounded-full bg-red-500/80"></div>
                            <div className="w-8 h-8 rounded-full bg-yellow-500/80 -ml-4"></div>
                        </div>
                    </div>
                    <div className="flex justify-between z-10 mt-auto">
                        <div>
                            <p className="text-[10px] opacity-70 uppercase tracking-widest">Holder</p>
                            <p className="font-bold text-sm">{cardName || 'SEU NOME'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] opacity-70 uppercase tracking-widest">Expires</p>
                            <p className="font-bold text-sm">{expiry || 'MM/YY'}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                            Número do Cartão
                        </label>
                        <input
                            type="text"
                            value={cardNumber}
                            onChange={e => setCardNumber(e.target.value)}
                            placeholder="0000 0000 0000 0000"
                            className="w-full h-14 bg-gray-50 border border-transparent focus:border-[#3ae012] focus:bg-white rounded-2xl px-4 font-bold text-lg outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                            Nome do Proprietário
                        </label>
                        <input
                            type="text"
                            value={cardName}
                            onChange={e => setCardName(e.target.value)}
                            placeholder="Nome Completo"
                            className="w-full h-14 bg-gray-50 border border-transparent focus:border-[#3ae012] focus:bg-white rounded-2xl px-4 font-bold outline-none transition-all"
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                                Exp. Data
                            </label>
                            <input
                                type="text"
                                value={expiry}
                                onChange={e => setExpiry(e.target.value)}
                                placeholder="MM/YY"
                                className="w-full h-14 bg-gray-50 border border-transparent focus:border-[#3ae012] focus:bg-white rounded-2xl px-4 font-bold outline-none transition-all text-center"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                                CVV
                            </label>
                            <input
                                type="text"
                                value={cvv}
                                onChange={e => setCvv(e.target.value)}
                                placeholder="123"
                                maxLength={3}
                                className="w-full h-14 bg-gray-50 border border-transparent focus:border-[#3ae012] focus:bg-white rounded-2xl px-4 font-bold outline-none transition-all text-center"
                            />
                        </div>
                    </div>

                    {/* Scan Options */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-2 shadow-sm mt-4">
                        <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors text-left border-b border-gray-50 last:border-0">
                            <div className="w-10 h-10 rounded-full bg-[#101b0d]/5 flex items-center justify-center text-[#101b0d]">
                                <Camera size={20} />
                            </div>
                            <span className="font-bold text-sm">Scanear cartão</span>
                        </button>
                        <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors text-left">
                            <div className="w-10 h-10 rounded-full bg-[#101b0d]/5 flex items-center justify-center text-[#101b0d]">
                                <ScanFace size={20} />
                            </div>
                            <span className="font-bold text-sm">Add Face ID</span>
                        </button>
                    </div>

                </div>
            </div>

            <div className="p-6 pb-safe bg-white border-t border-gray-50">
                <Button
                    className="w-full h-14 rounded-2xl bg-[#3ae012] text-white hover:bg-[#2db50e] font-bold shadow-lg shadow-green-500/20 text-lg flex items-center gap-2"
                    onClick={handleSave}
                >
                    <CreditCard size={20} /> Adicionar Cartão
                </Button>
            </div>
        </div>
    );
}
