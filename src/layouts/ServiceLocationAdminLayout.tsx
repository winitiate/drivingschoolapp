// src/layouts/ServiceLocationAdminLayout.tsx

/**
 * ServiceLocationAdminLayout.tsx
 *
 * Layout wrapper for service-location-admin pages.
 * Uses the shared Header (with dynamic menu) and Footer.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';

export default function ServiceLocationAdminLayout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Shared header with dynamic, role-aware menu */}
      <Header />

      <Container component="main" sx={{ flex: 1, p: 3, maxWidth: 800, mx: 'auto' }}>
        <Outlet />
      </Container>

      <Footer />
    </Box>
  );
}
