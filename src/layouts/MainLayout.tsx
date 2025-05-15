// src/layouts/MainLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import Footer from '../components/Layout/Footer';

export default function MainLayout() {
  const { user, signOutUser } = useAuth();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{ color: 'inherit', textDecoration: 'none', flexGrow: 1 }}
          >
            Driving School
          </Typography>

          {user ? (
            <>
              <Button color="inherit" component={RouterLink} to="/student-dashboard">
                Dashboard
              </Button>
              <Button color="inherit" onClick={() => signOutUser()}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/sign-in">
                Sign In
              </Button>
              <Button color="inherit" component={RouterLink} to="/sign-up">
                Sign Up
              </Button>
            </>
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