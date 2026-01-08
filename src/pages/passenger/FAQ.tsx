import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';

const FAQ_DATA = [
    {
        category: 'Conta',
        items: [
            { question: 'Como desbloquear a minha conta?', answer: 'Para desbloquear a sua conta, entre em contacto com o suporte ou redefina a sua palavra-passe.' },
            { question: 'Como trocar o número de telefone?', answer: 'Pode alterar o seu número de telefone nas definições do perfil.' },
            { question: 'Informações de Privacidade', answer: 'Levamos a sua privacidade a sério. Consulte os nossos termos de serviço para mais detalhes.' }
        ]
    },
    {
        category: 'Pagamento e preços',
        items: [
            { question: 'Métodos de pagamento aceites', answer: 'Aceitamos dinheiro, cartões de crédito/débito e M-Pesa.' },
            { question: 'Estimativa de preços', answer: 'O preço é estimado com base na distância e tempo da viagem.' },
            { question: 'Taxa de cancelamento', answer: 'Pode ser cobrada uma taxa se cancelar após o motorista já se ter deslocado.' }
        ]
    }
];

export default function FAQ() {
    const navigate = useNavigate();
    const [openIndex, setOpenIndex] = useState<{ cat: number, item: number } | null>(null);

    const toggle = (catIndex: number, itemIndex: number) => {
        if (openIndex?.cat === catIndex && openIndex?.item === itemIndex) {
            setOpenIndex(null);
        } else {
            setOpenIndex({ cat: catIndex, item: itemIndex });
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans flex flex-col">
            {/* Header */}
            <div className="bg-white pt-safe pb-4 px-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
                    <ChevronLeft size={24} className="text-black" />
                </button>
                <h1 className="text-lg font-bold text-black">FAQ's</h1>
                <div className="w-10" />
            </div>

            {/* Content */}
            <div className="flex-1 px-6 pt-6 pb-safe overflow-y-auto">
                {FAQ_DATA.map((cat, catIndex) => (
                    <div key={catIndex} className="mb-8">
                        <h2 className="text-xl font-bold text-[#101b0d] mb-4">{cat.category}</h2>
                        <div className="flex flex-col gap-3">
                            {cat.items.map((item, itemIndex) => {
                                const isOpen = openIndex?.cat === catIndex && openIndex?.item === itemIndex;
                                return (
                                    <div key={itemIndex} className="border-b border-gray-100 last:border-0 pb-3">
                                        <button
                                            onClick={() => toggle(catIndex, itemIndex)}
                                            className="w-full flex items-center justify-between py-2 text-left"
                                        >
                                            <span className="font-medium text-gray-700 text-sm">{item.question}</span>
                                            {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                        </button>
                                        {isOpen && (
                                            <div className="pt-2 text-gray-500 text-sm leading-relaxed animate-in slide-in-from-top-1 duration-200">
                                                {item.answer}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
