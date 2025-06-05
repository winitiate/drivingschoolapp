// src/pages/Business/BusinessSignIn.tsx

import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Divider,
  Container,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '../../auth/useAuth';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Layout/Header';
import Footer from '../../components/Layout/Footer';

export default function BusinessSignIn() {
  const { user, loading, signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Whenever auth state changes, route appropriately
  useEffect(() => {
    if (loading) return;

    if (user) {
      // If they have the "business" role and at least one business ID, redirect to /business
      if (user.roles.includes('business') && (user.ownedBusinessIds?.length || user.memberBusinessIds?.length)) {
        navigate('/business', { replace: true });
      } else {
        // Otherwise, send them to the sign-up flow
        navigate('/business/sign-up', { replace: true });
      }
    }
  }, [loading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      // onAuthStateChanged effect handles the redirect
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      // onAuthStateChanged effect handles the redirect
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      <Header />

      <Container maxWidth="sm">
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4 }}>
          <Typography variant="h5" mb={2}>
            Business Sign In
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField
            label="Email"
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
            sx={{ mt: 2 }}
            disabled={busy}
          >
            {busy ? 'Signing In…' : 'Sign In'}
          </Button>

          <Divider sx={{ my: 3 }}>OR</Divider>

          <Button
            variant="outlined"
            startIcon={<GoogleIcon />}
            fullWidth
            onClick={handleGoogle}
            disabled={busy}
          >
            {busy ? 'Please wait…' : 'Sign in with Google'}
          </Button>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
}
