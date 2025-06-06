// src/pages/Business/BusinessSignUp.tsx

import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Container,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../../auth/useAuth';
import {
  doc as firestoreDoc,
  setDoc,
  serverTimestamp,
  collection,
  getDoc,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { BusinessOnboardingSettings } from '../../models/BusinessOnboardingSettings';
import Header from '../../components/Layout/Header';
import Footer from '../../components/Layout/Footer';

export default function BusinessSignUp() {
  const { user, loading: authLoading, signUp } = useAuth();
  const navigate = useNavigate();

  //
  // ─── 1) Load the onboarding flag on mount ───────────────────────────────────
  //
  const [allowSelfRegistration, setAllowSelfRegistration] = useState<boolean | null>(null);
  const [loadingSetting, setLoadingSetting] = useState(true);
  const [errorSetting, setErrorSetting] = useState<string | null>(null);

  useEffect(() => {
    let unsub = false;

    async function loadOnboardingFlag() {
      setLoadingSetting(true);
      setErrorSetting(null);

      try {
        // 🔥 POINT TO platformSettings/businessOnboarding (not 'settings')
        const snap = await getDoc(
          firestoreDoc(db, 'platformSettings', 'businessOnboarding')
        );

        if (snap.exists()) {
          const data = snap.data() as BusinessOnboardingSettings;
          setAllowSelfRegistration(Boolean(data.allowSelfRegistration));
        } else {
          // default to false if the doc doesn’t exist yet
          setAllowSelfRegistration(false);
        }
      } catch (err: any) {
        setErrorSetting(err.message || 'Failed to load onboarding settings');
        setAllowSelfRegistration(false);
      } finally {
        if (!unsub) {
          setLoadingSetting(false);
        }
      }
    }

    loadOnboardingFlag();
    return () => {
      unsub = true;
    };
  }, []);

  //
  // ─── 2) If authenticated and already has a business → redirect to /business ──
  //
  useEffect(() => {
    // Once the user is authenticated (e.g. they just signed up),
    // you probably want to land them on “/business” (their dashboard).
    if (!authLoading && user) {
      navigate('/business', { replace: true });
    }
  }, [authLoading, user, navigate]);

  //
  // ─── 3) If self-registration is disabled, redirect immediately ───────────────
  //
  useEffect(() => {
    // Only once we’ve finished loading the setting, check its value…
    if (!loadingSetting && allowSelfRegistration === false) {
      navigate('/business/sign-in', { replace: true });
    }
  }, [loadingSetting, allowSelfRegistration, navigate]);

  //
  // ─── 4) Sign-up form state ───────────────────────────────────────────────────
  //
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setBusy(true);

    try {
      // ─────────────────────────────────────────────────────────────────────────
      // 1) Create the new Auth user first, so we get their `uid`
      // ─────────────────────────────────────────────────────────────────────────
      const newUser = await signUp(email.trim().toLowerCase(), password, ['business']);
      // We assume `signUp(...)` returns a `UserCredential`-like object with `user.uid`.
      // If your `signUp` does not return that, you can read `auth().currentUser` instead after sign-up.
      const uid = newUser.user.uid;
      const userEmail = newUser.user.email || email.trim().toLowerCase();
      const userName = newUser.user.displayName || '';

      // ─────────────────────────────────────────────────────────────────────────
      // 2) Create a new Business document with ownerId = uid
      // ─────────────────────────────────────────────────────────────────────────
      const bizRef = firestoreDoc(collection(db, 'businesses'));

      await setDoc(bizRef, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        ownerId: uid,
        ownerEmail: userEmail,
        ownerName: userName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Optionally: If you want to store this `businessId` on the new user’s profile,
      // you can do so inside `signUp` (e.g. by writing to /users/{uid}.ownedBusinessIds = [bizRef.id]).
      // But from here, we simply redirect to their dashboard:

      // ─────────────────────────────────────────────────────────────────────────
      // 3) Navigate to the business dashboard (or wherever you’d like)
      // ─────────────────────────────────────────────────────────────────────────
      navigate(`/business/${bizRef.id}`, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setBusy(false);
    }
  };

  //
  // ─── 5) Loading spinner while we check the “allowSelfRegistration” flag ─────
  //
  if (loadingSetting) {
    return (
      <Box sx={{ textAlign: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  //
  // ─── 6) If allowSelfRegistration was false, we’ve already redirected in useEffect. 
  //         If it was true, we render the form below.
  //
  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Header />

      <Container maxWidth="sm" sx={{ mt: 4, flexGrow: 1 }}>
        <Typography variant="h5" mb={2}>
          Business Sign Up
        </Typography>

        {errorSetting && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorSetting}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Business Name"
            fullWidth
            required
            margin="normal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
          />

          <TextField
            label="Email"
            fullWidth
            required
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            required
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
          />

          <TextField
            label="Confirm Password"
            type="password"
            fullWidth
            required
            margin="normal"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={busy}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            disabled={busy}
          >
            {busy ? 'Creating…' : 'Sign Up'}
          </Button>
        </form>
      </Container>

      <Footer />
    </Box>
  );
}
