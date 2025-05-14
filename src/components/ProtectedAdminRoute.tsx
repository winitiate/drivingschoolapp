// src/components/ProtectedAdminRoute.tsx
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function ProtectedAdminRoute() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      getDoc(doc(db, 'users', user.uid)).then((snap) => {
        setIsAdmin(snap.data()?.role === 'admin');
      });
    }
  }, [user]);

  if (loading || isAdmin === null) {
    return <p>Loading...</p>;
  }
  if (!user || !isAdmin) {
    return <Navigate to="/admin/sign-in" replace />;
  }
  return <Outlet />;
}
