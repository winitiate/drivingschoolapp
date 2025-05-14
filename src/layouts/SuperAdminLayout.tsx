// src/layouts/SuperAdminLayout.tsx
import React from 'react';
import { Outlet, Link as RouterLink } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Box, Button, Container } from '@mui/material';
import Footer from '../components/Footer';
import { useAuth } from '../auth/useAuth';

export default function SuperAdminLayout() {
  const { user, signOutUser } = useAuth();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/super-admin"
            sx={{ color: 'inherit', textDecoration: 'none', flexGrow: 1 }}
          >
            Platform Admin
          </Typography>

          {user && user.role === 'superAdmin' ? (
            <>
              <Button
                color="inherit"
                component={RouterLink}
                to="/super-admin"
              >
                Dashboard
              </Button>
              <Button
                color="inherit"
                component={RouterLink}
                to="/super-admin/schools"
              >
                Manage Schools
              </Button>
              <Button color="inherit" onClick={signOutUser}>
                Sign Out
              </Button>
            </>
          ) : (
            <Button
              color="inherit"
              component={RouterLink}
              to="/super-admin/sign-in"
            >
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
