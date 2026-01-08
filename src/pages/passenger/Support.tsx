import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Ticket, Phone, FileQuestion } from 'lucide-react';

export default function Support() {
    const navigate = useNavigate();

    const options = [
        { label: 'Perguntas frequentes', icon: FileQuestion, path: '/passenger/faq' },
        { label: 'Os seus tickets de suporte', icon: Ticket, path: '/passenger/tickets' },
        { label: 'Contacte-nos', icon: Phone, path: '/passenger/contact' },
    ];

    return (
        <div className="min-h-screen bg-white font-sans flex flex-col">
            {/* Header - Black Background */}
            <div className="bg-[#101b0d] pt-safe pb-6 px-4 flex items-center justify-between sticky top-0 z-10 shadow-md">
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <ChevronLeft size={24} className="text-white" />
                </button>
                <h1 className="text-lg font-bold text-white">Suporte</h1>
                <div className="w-10" />
            </div>

            {/* Content */}
            <div className="flex-1 px-6 pt-6">
                <div className="flex flex-col gap-4">
                    {options.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => navigate(item.path)}
                            className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-md transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-[#101b0d] group-hover:bg-[#3ae012] group-hover:text-black transition-colors">
                                    <item.icon size={20} className="stroke-[2px]" />
                                </div>
                                <span className="font-bold text-gray-900 text-sm">{item.label}</span>
                            </div>
                            <ChevronRight size={20} className="text-gray-300 group-hover:text-[#3ae012] transition-colors" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
