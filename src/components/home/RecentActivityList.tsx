
import { Button } from '../ui/button';
import car3d from '../../assets/3d/car_3d.png';

// Mock Data to match wireframe visual
const MOCK_RECENT = [
    {
        id: '1',
        driver: 'Steve Paimin',
        code: 'PO123RT',
        car: 'Toyota Corolla',
        pickup: 'Banasree',
        dest: 'Dhaka',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
        carImage: car3d // Use 3D asset
    },
    {
        id: '2',
        driver: 'Tianna Moore',
        code: 'RO213KS',
        car: 'Honda Fit',
        pickup: 'Kashipur',
        dest: 'Rampura',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
        carImage: car3d
    }
];

export const RecentActivityList = () => {
    return (
        <div className="w-full mt-6 mb-24 px-1">
            <h3 className="text-lg font-bold text-[#101b0d] mb-3">Viagens recentes</h3>
            <div className="flex flex-col gap-3">
                {MOCK_RECENT.length > 0 ? MOCK_RECENT.slice(0, 2).map((item) => (
                    <div key={item.id} className="bg-white rounded-[1.2rem] p-4 shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                    <img src={item.avatar} alt={item.driver} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-extrabold text-[#101b0d]">{item.code}</span>
                                    </div>
                                    <p className="text-xs text-gray-400">{item.driver}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="bg-green-50 text-[#10d772] hover:bg-green-100 hover:text-[#0eb35b] h-8 rounded-full text-[10px] font-bold px-3">
                                Pedir novamente
                            </Button>
                        </div>

                        {/* Route Info */}
                        <div className="grid grid-cols-2 gap-4 relative z-10 w-[70%]">
                            <div>
                                <p className="text-[10px] text-gray-400 mb-0.5">Pick-up</p>
                                <p className="text-sm font-bold text-[#101b0d] truncate">{item.pickup}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 mb-0.5">Destination</p>
                                <p className="text-sm font-bold text-[#101b0d] truncate">{item.dest}</p>
                            </div>
                        </div>

                        {/* Car Decor */}
                        <img
                            src={item.carImage}
                            alt={item.car}
                            className="absolute bottom-1 -right-2 w-20 object-contain drop-shadow-lg"
                        />
                    </div>
                )) : (
                    // Empty State
                    <div className="bg-gray-50 rounded-[1.2rem] p-6 text-center border border-dashed border-gray-200">
                        <p className="text-gray-400 font-medium text-sm">Sem viagens recentes</p>
                        <p className="text-xs text-gray-300 mt-1">As suas viagens aparecerão aqui</p>
                    </div>
                )}
            </div>
        </div>
    );
};
