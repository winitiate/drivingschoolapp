import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Stack } from '@mui/material';
import { useAuth } from '../auth/useAuth';

export default function SignUp() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const role = 'student';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signUp(email, pass, role);
  };

  return (
    <Box maxWidth="sm" mx="auto" py={4}>
      <Typography variant="h4" align="center" gutterBottom>
        Create Account
      </Typography>
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
        </Stack>
      </Box>
    </Box>
  );
}
