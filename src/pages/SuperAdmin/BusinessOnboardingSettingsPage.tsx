// src/pages/SuperAdmin/BusinessOnboardingSettingsPage.tsx

import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Switch,
  Button,
  CircularProgress,
  Alert,
  Paper,
} from "@mui/material";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

/**
 * BusinessOnboardingSettingsPage
 *
 * - Reads a single document at "platformSettings/businessOnboarding"
 * - Renders a switch that toggles whether business owners may self‐register
 * - If no document is found, defaults to false.
 * - Allows SuperAdmin to flip the switch and hit "Save Changes", which merges back to Firestore.
 */
export default function BusinessOnboardingSettingsPage() {
  const [allowSelfRegistration, setAllowSelfRegistration] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Firestore and a reference to our settings document
  const db = getFirestore();
  const settingsDocRef = doc(db, "platformSettings", "businessOnboarding");

  // 1) Load the document once on mount:
  const loadSetting = async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await getDoc(settingsDocRef);
      if (snap.exists()) {
        const data = snap.data() as any;
        setAllowSelfRegistration(Boolean(data.allowSelfRegistration));
      } else {
        // No document yet → default to false
        setAllowSelfRegistration(false);
      }
    } catch (err: any) {
      console.error("Error loading businessOnboarding setting:", err);
      setError(err.message || "Failed to load Business Onboarding Settings");
    } finally {
      setLoading(false);
    }
  };

  // 2) Save (or merge) updated toggle back to Firestore
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await setDoc(
        settingsDocRef,
        {
          allowSelfRegistration,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      // (Optionally you could show a “Saved!” snackbar here. This demo leaves it silent.)
    } catch (err: any) {
      console.error("Error saving businessOnboarding setting:", err);
      setError(err.message || "Failed to save Business Onboarding Settings");
    } finally {
      setSaving(false);
    }
  };

  // Trigger load on component mount
  useEffect(() => {
    loadSetting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If still loading from Firestore, show a centered spinner
  if (loading) {
    return (
      <Box textAlign="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h5" gutterBottom>
        Business Onboarding Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" alignItems="center">
          <Typography variant="body1" sx={{ mr: 2 }}>
            Allow business owners to self-register:
          </Typography>
          <Switch
            checked={allowSelfRegistration}
            onChange={(e) => setAllowSelfRegistration(e.target.checked)}
            disabled={saving}
          />
        </Box>
      </Paper>

      <Box sx={{ textAlign: "left" }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <CircularProgress size={20} /> : "Save Changes"}
        </Button>
      </Box>
    </Container>
  );
}
