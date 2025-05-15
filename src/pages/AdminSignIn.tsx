// src/pages/AdminSignIn.tsx
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
import { useAuth } from '../auth/useAuth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

export default function AdminSignIn() {
  const { user, loading, signInWithGoogle, signIn } = useAuth();
  const navigate = useNavigate();
  const db = getFirestore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleRedirect() {
      if (!user) return;

      // only allow schoolAdmin role
      if (!user.roles.includes('schoolAdmin')) {
        setError('You do not have admin permissions.');
        return;
      }

      try {
        // find all schools where user is owner or admin
        const q = query(
          collection(db, 'schools'),
          where('ownerId', '==', user.uid),
        );
        const q2 = query(
          collection(db, 'schools'),
          where('adminIds', 'array-contains', user.uid),
        );
        // run both queries and merge unique IDs
        const [snap1, snap2] = await Promise.all([getDocs(q), getDocs(q2)]);
        const ids = new Set<string>();
        snap1.forEach(doc => ids.add(doc.id));
        snap2.forEach(doc => ids.add(doc.id));

        if (ids.size === 0) {
          setError('No schools found for your account.');
        } else if (ids.size === 1) {
          const schoolId = Array.from(ids)[0];
          navigate(`/admin/${schoolId}`, { replace: true });
        } else {
          // multiple: send to a selection page
          // you’ll need to build /admin/select that reads the same queries
          navigate('/admin/select', { state: { schoolIds: Array.from(ids) } });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to lookup your schools.');
      }
    }

    if (!loading && user) {
      handleRedirect();
    }
  }, [user, loading, db, navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogle = async () => {
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
        School Admin Sign In
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Stack spacing={2} mt={2}>
        <form onSubmit={handleEmail}>
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
          onClick={handleGoogle}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Continue with Google'}
        </Button>
      </Stack>
    </Box>
  );
}
