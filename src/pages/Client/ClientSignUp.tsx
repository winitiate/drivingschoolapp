// src/pages/Client/ClientSignUp.tsx

/**
 * ClientSignUp.tsx
 *
 * Sign-up page for new clients.
 * Uses the useAuth abstraction for email/password and Google sign-up,
 * assigns the "client" role, and redirects to /client on success.
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Divider,
  CircularProgress,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';

export default function ClientSignUp() {
  const { user, loading: authLoading, signUp, signUpWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const role = 'client';

  // If auth is initializing, show spinner
  if (authLoading) {
    return (
      <Box textAlign="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  // If already signed in as a client, redirect to dashboard
  if (user && user.roles.includes('client')) {
    return <Navigate to="/client" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signUp(email.trim(), password, role);
      navigate('/client', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    }
  };

  const handleGoogle = async () => {
    setError(null);
    try {
      await signUpWithGoogle(role);
      navigate('/client', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to sign up with Google');
    }
  };

  return (
    <Box maxWidth="400px" mx="auto" mt={8} px={2}>
      <Typography variant="h4" align="center" gutterBottom>
        Client Sign Up
      </Typography>

      {error && (
        <Typography color="error" align="center" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" variant="contained" fullWidth>
            Sign Up
          </Button>

          <Divider>or</Divider>

          <Button
            variant="outlined"
            startIcon={<GoogleIcon />}
            fullWidth
            onClick={handleGoogle}
          >
            Continue with Google
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
