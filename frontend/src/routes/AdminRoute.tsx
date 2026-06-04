import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const hasAdminAccess = user?.roles?.includes('ADMIN') || user?.roles?.includes('MODERATOR') || user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('ROLE_MODERATOR');
  if (!hasAdminAccess) return <Navigate to="/" replace />;

  return <>{children}</>;
};
