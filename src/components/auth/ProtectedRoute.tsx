import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Auth } from '../../pages/Auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { state } = useAuth();

  // Show loading spinner while checking authentication
  if (state.isLoading) {
    return <LoadingSpinner message="Loading..." fullScreen />;
  }

  // Show auth page if not authenticated
  if (!state.isAuthenticated) {
    return <Auth />;
  }

  // Show protected content if authenticated
  return <>{children}</>;
};
