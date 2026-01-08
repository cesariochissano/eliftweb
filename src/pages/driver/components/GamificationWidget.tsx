import { Zap, Trophy, Star, Target } from 'lucide-react';
import { Progress } from '../../../components/ui/progress';

interface GamificationWidgetProps {
    totalTrips: number;
    rating: number;
}

export default function GamificationWidget({ totalTrips = 0, rating = 5.0 }: GamificationWidgetProps) {
    // Determine Level
    let level = 'Bronze';
    let nextLevel = 'Prata';
    let progress = 0;
    let target = 50;
    let iconColor = 'text-amber-700'; // Bronze color

    if (totalTrips >= 50 && totalTrips < 150) {
        level = 'Prata';
        nextLevel = 'Ouro';
        target = 150;
        progress = ((totalTrips - 50) / (150 - 50)) * 100;
        iconColor = 'text-gray-400';
    } else if (totalTrips >= 150) {
        level = 'Ouro';
        nextLevel = 'Diamante';
        target = 500;
        progress = ((totalTrips - 150) / (500 - 150)) * 100;
        iconColor = 'text-yellow-500';
    } else {
        // Bronze logic
        progress = (totalTrips / 50) * 100;
    }

    const isHighPriority = rating >= 4.8;

    return (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
            {/* Header: Level & Rating */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center border-2 border-white shadow-sm`}>
                        <Trophy className={iconColor} fill="currentColor" size={24} />
                    </div>
                    <div>
                        <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Nível Atual</div>
                        <div className={`font-black text-xl ${iconColor}`}>{level}</div>
                    </div>
                </div>

                <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-yellow-500 font-bold text-lg">
                        {rating.toFixed(1)} <Star fill="currentColor" size={18} />
                    </div>
                    {isHighPriority && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full mt-1">
                            <Zap size={10} fill="currentColor" /> Prioridade Alta
                        </div>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex justify-between text-xs font-medium mb-1 text-gray-500">
                    <span>{totalTrips} viagens</span>
                    <span>Próx: {nextLevel} ({target})</span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            {/* Daily Missions */}
            <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                    <Target size={14} className="text-primary" />
                    <span className="text-xs font-bold text-gray-700">Missões de Hoje</span>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Complete 5 viagens (3/5)</span>
                        <span className="font-bold text-primary">+50 MT</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[60%]" />
                    </div>
                </div>
            </div>
        </div>
    );
}
