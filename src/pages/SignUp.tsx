// src/pages/SignUp.tsx
import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Stack, Divider } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '../auth/useAuth';

export default function SignUp() {
  const { signUp, signUpWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState<string | null>(null);
  const role = 'student';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signUp(email, pass, role);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    try {
      await signUpWithGoogle(role);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Box maxWidth="sm" mx="auto" py={4}>
      <Typography variant="h4" align="center" gutterBottom>
        Create Account
      </Typography>
      {error && (
        <Typography color="error" align="center" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <Stack spacing={3}>
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
            value={pass}
            onChange={e => setPass(e.target.value)}
            required
          />
          <Button
            type="submit"
            variant="contained"
            color="secondary"
            fullWidth
          >
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
