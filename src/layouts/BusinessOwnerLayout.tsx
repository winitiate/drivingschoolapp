// src/layouts/BusinessOwnerLayout.tsx

import React from 'react'
import { Outlet } from 'react-router-dom'
import { Box, Container } from '@mui/material'
import Header from '../components/Layout/Header'
import Footer from '../components/Layout/Footer'

/**
 * Layout wrapper for business‐owner pages.
 * Uses the shared Header (with dynamic menu) and Footer.
 */
export default function BusinessOwnerLayout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />

      <Container component="main" sx={{ flex: 1, p: 3, maxWidth: 800, mx: 'auto' }}>
        <Outlet />
      </Container>

      <Footer />
    </Box>
  )
}
