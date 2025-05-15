import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Box, Container, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import Footer from '../components/Layout/Footer';
import { useAuth } from '../auth/useAuth';

export default function InstructorLayout() {
  const { user, signOutUser } = useAuth();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/instructor"
            sx={{ color: 'inherit', textDecoration: 'none', flexGrow: 1 }}
          >
            Instructor Portal
          </Typography>

          {user && user.role === 'instructor' ? (
            <>
              <Button color="inherit" component={RouterLink} to="/instructor/courses">
                My Courses
              </Button>
              <Button color="inherit" onClick={signOutUser}>
                Sign Out
              </Button>
            </>
          ) : (
            <Button color="inherit" component={RouterLink} to="/instructor/sign-in">
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
