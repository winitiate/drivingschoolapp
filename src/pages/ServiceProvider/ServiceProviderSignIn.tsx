// src/pages/ServiceProvider/ServiceProviderSignIn.tsx

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

export default function ServiceProviderSignIn() {
  const { user, loading, signInWithGoogle, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      if (user.roles.includes('serviceProvider')) {
        navigate('/service-provider', { replace: true });
      } else {
        setError('You do not have service provider permissions.');
        console.error(
          'ServiceProviderSignIn: missing serviceProvider role:',
          user.roles
        );
      }
    }
  }, [user, loading, navigate]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Box maxWidth="400px" mx="auto" mt={8} px={2}>
      <Typography variant="h4" align="center" gutterBottom>
        Service Provider Sign In
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Stack spacing={2} mt={2}>
        <form onSubmit={handleEmailSignIn}>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Continue with Google'}
        </Button>
      </Stack>
    </Box>
  );
}
