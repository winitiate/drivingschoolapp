// src/pages/ServiceLocation/Settings/PackageSettings/PackageSettings.tsx

/**
 * PackageSettings.tsx
 *
 * Admin interface for managing the “standard package” settings
 * (price and lesson count) for a specific service location.
 * Uses the PackageStore abstraction to load and save data.
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

import { Package } from '../../../../models/Package';
import { PackageStore } from '../../../../data/PackageStore';
import { FirestorePackageStore } from '../../../../data/FirestorePackageStore';

export default function PackageSettings() {
  const { serviceLocationId } = useParams<{ serviceLocationId: string }>();

  // Use the abstraction interface, not direct Firestore calls
  const store: PackageStore = useMemo(() => new FirestorePackageStore(), []);

  // Local state
  const [pkg, setPkg] = useState<Package | null>(null);
  const [price, setPrice] = useState<number | ''>('');
  const [lessonsCount, setLessonsCount] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing package settings for this location
  useEffect(() => {
    if (!serviceLocationId) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const all = await store.listAll();
        const existing = all.find(
          (p) => p.serviceLocationId === serviceLocationId
        ) || null;
        setPkg(existing);
        if (existing) {
          setPrice(existing.price);
          setLessonsCount(existing.lessonsCount);
        } else {
          setPrice('');
          setLessonsCount('');
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load package settings');
      } finally {
        setLoading(false);
      }
    })();
  }, [serviceLocationId, store]);

  // Save or update the package settings
  const handleSave = async () => {
    if (!serviceLocationId) return;
    setSaving(true);
    setError(null);
    try {
      const data: Package = {
        // If there's an existing record, preserve its id
        id: pkg?.id || '',
        serviceLocationId,
        price: typeof price === 'number' ? price : 0,
        lessonsCount:
          typeof lessonsCount === 'number' ? lessonsCount : 0,
      };
      await store.save(data);

      // Reload to pick up generated id / timestamps
      const all = await store.listAll();
      const saved = all.find(
        (p) => p.serviceLocationId === serviceLocationId
      ) || data;
      setPkg(saved);
      setPrice(saved.price);
      setLessonsCount(saved.lessonsCount);
    } catch (e: any) {
      setError(e.message || 'Failed to save package settings');
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
        Package Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        label="Standard Package Price"
        type="number"
        fullWidth
        margin="normal"
        value={price}
        onChange={(e) =>
          setPrice(
            e.target.value === '' ? '' : Number(e.target.value)
          )
        }
      />

      <TextField
        label="Standard Package Lessons Count"
        type="number"
        fullWidth
        margin="normal"
        value={lessonsCount}
        onChange={(e) =>
          setLessonsCount(
            e.target.value === '' ? '' : Number(e.target.value)
          )
        }
      />

      <Box mt={2}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save Package Settings'}
        </Button>
      </Box>
    </Box>
  );
}
