// src/pages/InstructorSignIn.tsx
import React, { useState } from 'react';
import { Container, Box, TextField, Button, Typography, Alert } from '@mui/material';
import { useAuth } from '../auth/useAuth';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

export default function InstructorSignIn() {
  const { signInUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Sign in (will populate user.role)
      await signInUser(email, password);
      // Redirect to instructor dashboard
      navigate('/instructor');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box mt={8} mb={4} textAlign="center">
        <Typography variant="h5">Instructor Sign In</Typography>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
        <TextField
          label="Email"
          type="email"
          value={email}
          required
          fullWidth
          onChange={e => setEmail(e.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          required
          fullWidth
          onChange={e => setPassword(e.target.value)}
        />
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? 'Signing In…' : 'Sign In'}
        </Button>
        <Button
          component={RouterLink}
          to="/"
          color="secondary"
        >
          Back to Home
        </Button>
      </Box>
    </Container>
  );
}
