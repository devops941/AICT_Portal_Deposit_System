import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredPermissions?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermissions,
}) => {
  const { isAuthenticated, isLoading, user, hasRole, hasPermission } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Authenticating session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check roles if specified
  if (allowedRoles && allowedRoles.length > 0) {
    const isAllowed = allowedRoles.some((r) => hasRole(r));
    if (!isAllowed) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500 max-w-md">
            Your role ({user.roles.join(', ')}) does not have permission to access this resource.
          </p>
          <Button onClick={() => window.history.back()} variant="outline" size="sm">
            Go Back
          </Button>
        </div>
      );
    }
  }

  // Check permissions if specified
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAll = requiredPermissions.every((p) => hasPermission(p));
    if (!hasAll) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Insufficient Permissions</h2>
          <p className="text-xs text-slate-500 max-w-md">
            Missing required permission: [{requiredPermissions.join(', ')}].
          </p>
          <Button onClick={() => window.history.back()} variant="outline" size="sm">
            Go Back
          </Button>
        </div>
      );
    }
  }

  return <>{children}</>;
};
