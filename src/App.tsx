import { useState, useEffect } from 'react';
import { WifiOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAuthStore } from './stores/useAuthStore';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import LoginPhone from './pages/auth/LoginPhone';
import LoginEmail from './pages/auth/LoginEmail';
import OTPVerify from './pages/auth/OTPVerify';
import CompleteProfile from './pages/auth/CompleteProfile';
import RoleSelection from './pages/auth/RoleSelection';
import DriverDashboard from './pages/driver/Dashboard';
import FleetDashboard from './pages/fleet/FleetDashboard';
// Passenger Pages
import HomePassenger from './pages/passenger/Home';
import PassengerTrips from './pages/passenger/Trips';
import PassengerProfile from './pages/passenger/Profile';
import PassengerSettings from './pages/passenger/Settings';
import PassengerMenu from './pages/passenger/Menu';
import PassengerSupport from './pages/passenger/Support';
import PassengerFAQ from './pages/passenger/FAQ';
import ContactSupport from './pages/passenger/ContactSupport';
import ReportAccident from './pages/passenger/ReportAccident';
import PassengerPayments from './pages/passenger/Payments';
import AddCard from './pages/passenger/AddCard';
import PassengerPromotions from './pages/passenger/Promotions';

// Driver Pages
import DriverEarnings from './pages/driver/Earnings';
import DriverProfile from './pages/driver/Profile';
import DriverDocuments from './pages/driver/Documents';
// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminVerifications from './pages/admin/AdminVerifications';
import AdminTickets from './pages/admin/Tickets';
import AdminFleets from './pages/admin/AdminFleets';
import AdminFinancials from './pages/admin/Financials';
import AdminLayout from './components/admin/AdminLayout';

import Terms from './pages/Terms';

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, setUser, setLoading, loading, initialized } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 1. Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      if (session) {
        setUser(session.user);
      } else {
        setLoading(false);
        if (!['/', '/auth/login-email', '/auth/otp', '/terms'].includes(location.pathname)) {
          navigate('/');
        }
      }
    });

    // 2. Auth State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
        if (!['/', '/auth/login-email', '/auth/otp', '/terms'].includes(location.pathname)) {
          navigate('/');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const isAuthPage = ['/', '/auth/login-email', '/auth/otp'].includes(location.pathname);

    if (initialized && user && isAuthPage) {
      if (!profile) {
        navigate('/auth/complete-profile');
        return;
      }

      if (!profile.role) {
        navigate('/auth/role');
        return;
      }

      // Universal Landing Rule: Everyone goes to Passenger Home by default
      // Specialized dashboards (Admin, Driver) are accessed via Menu
      navigate('/home');
    }
  }, [user, profile, initialized, location.pathname]);

  if (loading && !initialized) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-primary mb-4" size={40} />
        <p className="text-gray-500 font-medium">Carregando eLift...</p>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="relative font-sans antialiased text-gray-900 overflow-x-hidden">
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 right-0 z-[9999] bg-gray-900 text-white p-2 text-center text-xs font-bold flex items-center justify-center gap-2"
          >
            <WifiOff size={14} /> Você está offline. Algumas funcionalidades podem não funcionar.
          </motion.div>
        )}
      </AnimatePresence>

      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LoginPhone />} />
            <Route path="/auth/login-email" element={<LoginEmail />} />
            <Route path="/auth/otp" element={<OTPVerify />} />
            <Route path="/auth/complete-profile" element={<CompleteProfile />} />
            <Route path="/auth/role" element={<RoleSelection />} />
            {/* Dashboard Motorista */}
            <Route path="/driver/dashboard" element={<ProtectedRoute allowedRoles={['DRIVER', 'SUPER_ADMIN']}><DriverDashboard /></ProtectedRoute>} />
            <Route path="/driver/earnings" element={<ProtectedRoute allowedRoles={['DRIVER', 'SUPER_ADMIN']}><DriverEarnings /></ProtectedRoute>} />
            <Route path="/driver/profile" element={<ProtectedRoute allowedRoles={['DRIVER', 'SUPER_ADMIN']}><DriverProfile /></ProtectedRoute>} />
            <Route path="/driver/documents" element={<ProtectedRoute allowedRoles={['DRIVER', 'SUPER_ADMIN']}><DriverDocuments /></ProtectedRoute>} />

            {/* Dashboard Frotista */}
            <Route path="/fleet/dashboard" element={<ProtectedRoute allowedRoles={['FLEET_MANAGER', 'SUPER_ADMIN']}><FleetDashboard /></ProtectedRoute>} />

            {/* Admin Panel (Persistent Layout) */}
            <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SERVICE_ADMIN']}><AdminLayout /></ProtectedRoute>}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/verifications" element={<AdminVerifications />} />
              <Route path="/admin/tickets" element={<AdminTickets />} />
              <Route path="/admin/fleets" element={<AdminFleets />} />
              <Route path="/admin/financials" element={<AdminFinancials />} />
            </Route>

            {/* Passageiro */}
            <Route path="/home" element={<ProtectedRoute allowedRoles={['PASSENGER', 'SUPER_ADMIN']}><HomePassenger /></ProtectedRoute>} />
            <Route path="/passenger/trips" element={<ProtectedRoute allowedRoles={['PASSENGER', 'SUPER_ADMIN']}><PassengerTrips /></ProtectedRoute>} />
            <Route path="/passenger/profile" element={<ProtectedRoute allowedRoles={['PASSENGER', 'SUPER_ADMIN']}><PassengerProfile /></ProtectedRoute>} />
            <Route path="/passenger/settings" element={<ProtectedRoute allowedRoles={['PASSENGER', 'SUPER_ADMIN']}><PassengerSettings /></ProtectedRoute>} />
            <Route path="/passenger/menu" element={<ProtectedRoute allowedRoles={['PASSENGER', 'SUPER_ADMIN']}><PassengerMenu /></ProtectedRoute>} />
            <Route path="/passenger/support" element={<ProtectedRoute allowedRoles={['PASSENGER', 'SUPER_ADMIN']}><PassengerSupport /></ProtectedRoute>} />
            <Route path="/passenger/faq" element={<ProtectedRoute allowedRoles={['PASSENGER', 'SUPER_ADMIN']}><PassengerFAQ /></ProtectedRoute>} />
            <Route path="/passenger/contact" element={<ProtectedRoute allowedRoles={['PASSENGER', 'SUPER_ADMIN']}><ContactSupport /></ProtectedRoute>} />
            <Route path="/passenger/report-accident" element={<ProtectedRoute allowedRoles={['PASSENGER', 'SUPER_ADMIN']}><ReportAccident /></ProtectedRoute>} />
            <Route path="/passenger/payments" element={<ProtectedRoute allowedRoles={['PASSENGER', 'SUPER_ADMIN']}><PassengerPayments /></ProtectedRoute>} />
            <Route path="/passenger/payment/add-card" element={<ProtectedRoute allowedRoles={['PASSENGER', 'SUPER_ADMIN']}><AddCard /></ProtectedRoute>} />
            <Route path="/passenger/promotions" element={<ProtectedRoute allowedRoles={['PASSENGER', 'SUPER_ADMIN']}><PassengerPromotions /></ProtectedRoute>} />

            <Route path="/terms" element={<Terms />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}
