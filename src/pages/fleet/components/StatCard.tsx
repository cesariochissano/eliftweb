import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    trend?: string;
    color: string;
    bgColor: string;
}

export default function StatCard({ title, value, icon: Icon, trend, color, bgColor }: StatCardProps) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bgColor} ${color} mb-4`}>
                <Icon size={20} />
            </div>
            <div>
                <p className="text-gray-500 text-xs font-bold uppercase mb-1">{title}</p>
                <div className="flex items-end gap-2">
                    <h3 className="text-2xl font-bold tracking-tight text-gray-900">{value}</h3>
                    {trend && (
                        <span className="text-xs font-bold text-green-600 mb-1 bg-green-50 px-1.5 py-0.5 rounded">
                            {trend}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
