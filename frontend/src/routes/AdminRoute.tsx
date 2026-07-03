import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore, isAdmin } from '../store/authStore';

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const hasAdminAccess = isAdmin(user);
  if (!hasAdminAccess) return <Navigate to="/" replace />;

  return <>{children}</>;
};
