// src/pages/ServiceLocation/ServiceLocationSignIn.tsx

/**
 * ServiceLocationSignIn.tsx
 *
 * Sign-in page for service-location administrators.
 * Uses the Auth abstraction for sign-in, then the ServiceLocationStore
 * abstraction to look up which locations the user can manage.
 */

import React, { useEffect, useState, useMemo } from 'react';
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
import { ServiceLocationStore } from '../../data/ServiceLocationStore';
import { FirestoreServiceLocationStore } from '../../data/FirestoreServiceLocationStore';

export default function ServiceLocationSignIn() {
  const { user, loading, signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Use the store abstraction, not direct Firestore queries
  const store: ServiceLocationStore = useMemo(
    () => new FirestoreServiceLocationStore(),
    []
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // After sign-in, look up which locations this admin can manage
  useEffect(() => {
    if (loading || !user) return;

    // Only service-location admins may proceed
    if (!user.roles.includes('serviceLocationAdmin')) {
      setError('You do not have service-location admin permissions.');
      return;
    }

    (async () => {
      setError(null);
      try {
        // Locations owned by this user
        const owned = await store.listByOwner(user.uid);
        // All locations, to filter those where user is in adminIds
        const all = await store.listAll();
        const adminOf = all.filter(loc =>
          Array.isArray(loc.adminIds) && loc.adminIds.includes(user.uid)
        );

        // Combine unique IDs
        const ids = Array.from(
          new Set([
            ...owned.map(l => l.id),
            ...adminOf.map(l => l.id),
          ])
        );

        if (ids.length === 0) {
          setError('No service locations found for your account.');
        } else if (ids.length === 1) {
          navigate(`/service-location/${ids[0]}`, { replace: true });
        } else {
          // TODO: implement a selection page at /service-location/select
          navigate('/service-location/select', {
            state: { serviceLocationIds: ids },
          });
        }
      } catch (e: any) {
        setError(e.message || 'Failed to look up service locations.');
      }
    })();
  }, [user, loading, navigate, store]);

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
        Service-Location Admin Sign In
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
              onChange={e => setEmail(e.target.value)}
              required
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              value={password}
              onChange={e => setPassword(e.target.value)}
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
