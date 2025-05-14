// src/layouts/AdminLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Box, Container, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import Footer from '../components/Footer';
import { useAuth } from '../auth/useAuth';

export default function AdminLayout() {
  const { user, signOutUser } = useAuth();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/admin"
            sx={{ color: 'inherit', textDecoration: 'none', flexGrow: 1 }}
          >
            Admin Dashboard
          </Typography>

          {user ? (
            <Button color="inherit" onClick={() => signOutUser()}>
              Sign Out
            </Button>
          ) : (
            <Button color="inherit" component={RouterLink} to="/admin/sign-in">
              Sign In
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Container component="main" sx={{ flex: 1, p: 3, maxWidth: 800, mx: 'auto' }}>
        <Outlet />
      </Container>

      <Footer />
    </Box>
  );
}