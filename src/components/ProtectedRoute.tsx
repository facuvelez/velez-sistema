import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useGuestOperator } from '@/contexts/GuestOperatorContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = '/login'
}) => {
  const { user, profile, loading, canAccess } = useAuth();
  const { guestOperator } = useGuestOperator();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Guest operator has access only to routes that allow Operator
  if (guestOperator && (!allowedRoles || allowedRoles.includes(guestOperator.role))) {
    return <>{children}</>;
  }

  if (!user || !profile) {
    return <Navigate to={redirectTo} replace />;
  }

  if (allowedRoles && !canAccess(allowedRoles)) {
    if (profile.role === 'Operator' || profile.role === 'Alineador') {
      return <Navigate to="/operator" replace />;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
