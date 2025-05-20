// src/pages/ServiceLocation/Settings/SquareUpSettings/SquareUpSettings.tsx

/**
 * SquareUpSettings.tsx
 *
 * Admin interface for configuring SquareUp credentials for a specific
 * service location. Loads existing values via the ServiceLocationStore
 * abstraction and saves updates back through the same interface.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';

import { ServiceLocation } from '../../../../models/ServiceLocation';
import { ServiceLocationStore } from '../../../../data/ServiceLocationStore';
import { FirestoreServiceLocationStore } from '../../../../data/FirestoreServiceLocationStore';

export default function SquareUpSettings() {
  const { serviceLocationId } = useParams<{ serviceLocationId: string }>();

  // Use the abstraction rather than Firestore directly
  const store: ServiceLocationStore = useMemo(
    () => new FirestoreServiceLocationStore(),
    []
  );

  const [location, setLocation] = useState<ServiceLocation | null>(null);
  const [appId, setAppId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing settings on mount / id change
  useEffect(() => {
    if (!serviceLocationId) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const loc = await store.getById(serviceLocationId);
        if (!loc) throw new Error('Service location not found');
        setLocation(loc);
        setAppId(loc.squareApplicationId || '');
        setAccessToken(loc.squareAccessToken || '');
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [serviceLocationId, store]);

  // Save updates via the abstraction
  const handleSave = async () => {
    if (!location) return;
    setSaving(true);
    setError(null);
    try {
      const updated: ServiceLocation = {
        ...location,
        squareApplicationId: appId,
        squareAccessToken: accessToken,
      };
      await store.save(updated);
      setLocation(updated);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box textAlign="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        SquareUp Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        label="Square Application ID"
        fullWidth
        margin="normal"
        value={appId}
        onChange={e => setAppId(e.target.value)}
      />

      <TextField
        label="Square Access Token"
        fullWidth
        margin="normal"
        value={accessToken}
        onChange={e => setAccessToken(e.target.value)}
      />

      <Box mt={2}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save SquareUp Settings'}
        </Button>
      </Box>
    </Box>
  );
}
