// src/pages/SuperAdmin/SuperAdminSignIn.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert
} from '@mui/material';
import { useAuth } from '../../auth/useAuth';

export default function SuperAdminSignIn() {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [busy, setBusy]         = useState(false);

  const redirectToDashboard = () => {
    navigate('/super-admin/businesses', { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      redirectToDashboard();
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
      await signInWithGoogle();
      redirectToDashboard();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
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

      <Typography align="center" sx={{ my: 1 }}>or</Typography>

      <Button
        variant="outlined"
        fullWidth
        startIcon={
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google logo"
            width={20}
            height={20}
          />
        }
        onClick={handleGoogle}
        disabled={busy}
      >
        Continue with Google
      </Button>
    </Box>
  );
}
