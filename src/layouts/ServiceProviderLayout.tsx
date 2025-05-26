// src/layouts/ServiceProviderLayout.tsx
/**
 * ServiceProviderLayout.tsx
 *
 * Layout wrapper for the service-provider portal – re-uses the shared
 * Header (with dynamic, role-aware menu) and Footer so the UX matches
 * your other dashboards.
 */

import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box, Container } from '@mui/material';

import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import { useAuth } from '../auth/useAuth';

export default function ServiceProviderLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Make sure an unauthenticated user cannot sit on this layout
  useEffect(() => {
    if (!user) navigate('/sign-in', { replace: true });
  }, [user, navigate]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Shared “hamburger” header with dynamic menu items */}
      <Header />

      {/* Main content */}
      <Container component="main" sx={{ flex: 1, p: 3, maxWidth: 800, mx: 'auto' }}>
        <Outlet />
      </Container>

      {/* Shared footer */}
      <Footer />
    </Box>
  );
}
