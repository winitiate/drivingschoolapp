import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

interface ProtectedInstructorRouteProps {
  redirectPath?: string;
}

export default function ProtectedInstructorRoute({
  redirectPath = '/sign-in',
}: ProtectedInstructorRouteProps) {
  const { user } = useAuth();

  if (!user) {
    // not logged in
    return <Navigate to={redirectPath} replace />;
  }
  if (user.role !== 'instructor') {
    // logged in but not an instructor
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
