// src/pages/InstructorDashboard.tsx
import React from 'react';
import { Container, Box, Typography, Button } from '@mui/material';
import { useAuth } from '../auth/useAuth';
import { Link as RouterLink } from 'react-router-dom';

export default function InstructorDashboard() {
  const { user, signOutUser } = useAuth();

  return (
    <Container maxWidth="md">
      <Box mt={4} mb={2} textAlign="center">
        <Typography variant="h4">Instructor Dashboard</Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Welcome, {user?.email}
        </Typography>
      </Box>

      {/* TODO: Replace with real instructor portal content */}
      <Box display="flex" justifyContent="center" gap={2} mb={4}>
        <Button
          component={RouterLink}
          to="/instructor/courses"
          variant="contained"
        >
          My Courses
        </Button>
        <Button
          component={RouterLink}
          to="/instructor/sign-in"
          onClick={signOutUser}
          variant="outlined"
        >
          Sign Out
        </Button>
      </Box>
    </Container>
  );
}
