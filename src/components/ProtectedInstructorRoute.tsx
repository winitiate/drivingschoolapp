// src/components/ProtectedInstructorRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export default function ProtectedInstructorRoute({
  redirectPath = '/instructor/sign-in',
}: { redirectPath?: string }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading…</p>;
  if (!user || !user.roles.includes('instructor')) {
    return <Navigate to={redirectPath} replace />;
  }
  return <Outlet />;
}
