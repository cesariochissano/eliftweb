import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import type { UserRole } from '../../stores/useAuthStore';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, profile, loading, initialized } = useAuthStore();
    const location = useLocation();

    if (loading && !initialized) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-primary mb-4" size={40} />
                <p className="text-gray-500 font-medium">Verificando permissões...</p>
            </div>
        );
    }

    if (!user) {
        // Redirect to login but save the current location
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
        // Role not authorized
        console.warn(`Access denied for role: ${profile.role}. Required: ${allowedRoles.join(', ')}`);

        // Redirect based on role
        if (profile.role === 'DRIVER') return <Navigate to="/driver/dashboard" replace />;
        if (profile.role === 'FLEET_MANAGER') return <Navigate to="/fleet/dashboard" replace />;
        if (profile.role === 'PASSENGER') return <Navigate to="/home" replace />;

        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
