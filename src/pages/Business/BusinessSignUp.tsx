// src/pages/Business/BusinessSignUp.tsx

import React, { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography, Alert } from '@mui/material';
import { useAuth } from '../../auth/useAuth';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNavigate } from 'react-router-dom';

export default function BusinessSignUp() {
  const { user, loading, signUp } = useAuth();
  const navigate = useNavigate();

  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [error, setError]         = useState<string | null>(null);

  // After sign-up + onAuthStateChanged, redirect
  useEffect(() => {
    if (!loading && user?.roles.includes('business') && user.businessId) {
      navigate(`/business/${user.businessId}`);
    }
  }, [loading, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    try {
      // 1) create the Business doc
      const ref = doc(collection(db, 'businesses'));
      await setDoc(ref, {
        name,
        email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const businessId = ref.id;

      // 2) sign up the user with the new businessId
      await signUp(email, password, ['business'], businessId);
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" mb={2}>Business Sign Up</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TextField
        label="Business Name"
        fullWidth
        required
        margin="normal"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <TextField
        label="Email"
        fullWidth
        required
        margin="normal"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <TextField
        label="Password"
        type="password"
        fullWidth
        required
        margin="normal"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <TextField
        label="Confirm Password"
        type="password"
        fullWidth
        required
        margin="normal"
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
      />
      <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
        Sign Up
      </Button>
    </Box>
  );
}
