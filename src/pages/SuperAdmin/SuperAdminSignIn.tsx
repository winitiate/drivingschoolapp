// src/pages/SuperAdmin/SuperAdminSignIn.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Container,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '../../auth/useAuth';
import Header from '../../components/Layout/Header';
import Footer from '../../components/Layout/Footer';

export default function SuperAdminSignIn() {
  const navigate = useNavigate();
  const { user, loading, signIn, signInWithGoogle, signOutUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // If a super-admin is already logged in, redirect them immediately
  useEffect(() => {
    if (!loading && user?.roles.includes('superAdmin')) {
      navigate('/super-admin', { replace: true });
    }
  }, [loading, user, navigate]);

  // After any successful login, navigate to the root of /super-admin
  // so that ProtectedSuperAdminRoute can choose the correct child route.
  const redirectToSuperAdminRoot = () => {
    navigate('/super-admin', { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      await signIn(email.trim().toLowerCase(), password);
      redirectToSuperAdminRoot();
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);

    try {
      // If someone (even non-super) is already signed in, sign them out first
      if (user) {
        await signOutUser();
      }

      await signInWithGoogle();
      redirectToSuperAdminRoot();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Header />

      <Container maxWidth="sm" sx={{ flexGrow: 1 }}>
        <Box
          maxWidth="400px"
          mx="auto"
          mt={8}
          p={4}
          boxShadow={3}
          borderRadius={2}
        >
          <Typography variant="h5" align="center" gutterBottom>
            Super Admin Sign In
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              margin="normal"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={busy}
            />

            <TextField
              label="Password"
              type="password"
              fullWidth
              required
              margin="normal"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={busy}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={busy}
              sx={{ mt: 2, mb: 1 }}
            >
              {busy ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <Typography align="center" sx={{ my: 1 }}>
            or
          </Typography>

          <Button
            variant="outlined"
            fullWidth
            startIcon={<GoogleIcon />}
            onClick={handleGoogle}
            disabled={busy}
          >
            {busy ? 'Please wait…' : 'Continue with Google'}
          </Button>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
}
