// src/pages/Client/ClientSignIn.tsx

/**
 * ClientSignIn.tsx
 *
 * Sign-in page for clients.
 * Uses the useAuth abstraction for email/password and Google sign-in,
 * and redirects to /client if the user has the “client” role.
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  Stack,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';

export default function ClientSignIn() {
  const { user, loading, signInWithGoogle, signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // After loading, if signed in with the client role, redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      if (user.roles.includes('client')) {
        navigate('/client', { replace: true });
      } else {
        setError('You do not have client permissions.');
        console.error('ClientSignIn: missing client role:', user.roles);
      }
    }
  }, [user, loading, navigate]);

  // Email/password submit
  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    }
  };

  // Google button
  const handleGoogle = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    }
  };

  return (
    <Box maxWidth="400px" mx="auto" mt={8} px={2}>
      <Typography variant="h4" align="center" gutterBottom>
        Client Sign In
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <Stack spacing={2} mt={2}>
        <form onSubmit={handleEmail}>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              required
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </Stack>
        </form>

        <Divider>or</Divider>

        <Button
          variant="outlined"
          startIcon={<GoogleIcon />}
          fullWidth
          onClick={handleGoogle}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Continue with Google'}
        </Button>
      </Stack>
    </Box>
  );
}
