import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
    LayoutDashboard, FileCheck, MessageSquare,
    Truck, CreditCard, LogOut, Menu, X, Shield
} from 'lucide-react';
import { Button } from '../ui/button';

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const menuItems = [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
        { label: 'Verificações', icon: FileCheck, path: '/admin/verifications' },
        { label: 'Suporte', icon: MessageSquare, path: '/admin/tickets' },
        { label: 'Frotas', icon: Truck, path: '/admin/fleets' },
        { label: 'Financeiro', icon: CreditCard, path: '/admin/financials' },
    ];

    const handleExit = () => {
        navigate('/home');
    };

    const NavItem = ({ item, mobile = false }: { item: any; mobile?: boolean }) => {
        const isActive = location.pathname === item.path;
        return (
            <Button
                variant={isActive ? 'primary' : 'ghost'}
                className={`w-full justify-start font-bold gap-3 rounded-xl h-12 ${isActive ? '' : 'text-gray-500 hover:text-primary hover:bg-primary/5'
                    }`}
                onClick={() => {
                    navigate(item.path);
                    if (mobile) setIsMobileMenuOpen(false);
                }}
            >
                <item.icon size={20} />
                {item.label}
            </Button>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 bg-white border-r border-gray-100 flex-col sticky top-0 h-screen">
                <div className="p-8 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                            <Shield size={20} />
                        </div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tighter">
                            eLift<span className="text-primary">.admin</span>
                        </h1>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <div className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Menu Principal</div>
                    {menuItems.map((item) => (
                        <NavItem key={item.path} item={item} />
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-50">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 font-bold gap-3 rounded-xl"
                        onClick={handleExit}
                    >
                        <LogOut size={20} />
                        Sair do Painel
                    </Button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-100 p-4 z-40 flex justify-between items-center h-16 shadow-sm">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
                        <Menu size={24} />
                    </Button>
                    <h1 className="font-black text-lg tracking-tighter">eLift<span className="text-primary">.admin</span></h1>
                </div>
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    <Shield size={18} />
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[100] transition-all">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                    <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col p-6 animate-in slide-in-from-left duration-300">
                        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-50">
                            <h1 className="text-xl font-black tracking-tighter">eLift<span className="text-primary">.admin</span></h1>
                            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                                <X size={24} />
                            </Button>
                        </div>
                        <nav className="flex-1 space-y-2">
                            {menuItems.map((item) => (
                                <NavItem key={item.path} item={item} mobile />
                            ))}
                        </nav>
                        <div className="pt-4 border-t border-gray-50">
                            <Button
                                variant="outline"
                                className="w-full text-red-500 border-red-100 font-bold gap-3 rounded-xl h-12"
                                onClick={handleExit}
                            >
                                <LogOut size={18} />
                                Sair do Painel
                            </Button>
                        </div>
                    </aside>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col pt-16 md:pt-0">
                <div className="p-4 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
