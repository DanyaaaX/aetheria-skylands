
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTonWallet } from '@tonconnect/ui-react';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, isAuthenticated, isLoading }) => {
  const wallet = useTonWallet();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
        <p className="text-cyan-400 font-cinzel tracking-widest animate-pulse uppercase text-sm">Synchronizing Cloud Data...</p>
      </div>
    );
  }

  // If no wallet is connected OR no user profile is found after loading
  if (!wallet || !isAuthenticated) {
    // Redirect to home, but save the location they were trying to go to
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
