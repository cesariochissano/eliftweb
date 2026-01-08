import type { ComponentType } from 'react';

interface ServiceCardProps {
    title: string;
    description: string;
    icon: ComponentType<any>;
    selected: boolean;
    onClick: () => void;
    price?: string;
}

export function ServiceCard({ title, description, icon: Icon, selected, onClick, price }: ServiceCardProps) {
    return (
        <button
            onClick={onClick}
            className={`
                relative flex flex-col items-center justify-between p-3 rounded-2xl cursor-pointer transition-all duration-300 outline-none
                ${selected
                    ? 'bg-green-50/50 border-[3px] border-[#3ae012] shadow-sm'
                    : 'bg-white border border-gray-100 shadow-sm hover:border-gray-200'
                }
                min-w-[140px] h-[170px]
            `}
        >
            <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-colors
                ${selected ? 'bg-[#3ae012] text-white' : 'bg-green-50 text-[#3ae012]'}
            `}>
                <Icon size={26} strokeWidth={2.5} />
            </div>

            <div className="text-center flex-1 flex flex-col items-center">
                <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1">{title}</h3>
                <p className="text-[10px] text-gray-500 leading-tight max-w-[100px]">{description}</p>
            </div>

            {price && (
                <div className="mt-2 bg-gray-100 text-[#101b0d] font-black text-sm px-4 py-1.5 rounded-lg w-full text-center">
                    {price}
                </div>
            )}
        </button>
    );
}
