// src/pages/Business/Settings/BusinessSettingsManager.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
} from '@mui/material';

import { BusinessSettings } from '../../../models/BusinessSettings';
import { BusinessSettingsStore } from '../../../data/BusinessSettingsStore';
import { FirestoreBusinessSettingsStore } from '../../../data/FirestoreBusinessSettingsStore';
import BusinessSettingsFormDialog from '../../../components/BusinessSettings/BusinessSettingsFormDialog';

export default function BusinessSettingsManager() {
  const { businessId } = useParams<{ businessId: string }>();
  const store: BusinessSettingsStore = useMemo(
    () => new FirestoreBusinessSettingsStore(),
    []
  );

  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const reload = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await store.getByBusinessId(businessId);
      if (result) {
        setSettings(result);
      } else {
        setSettings({
          id: businessId,
          businessId,
          appointmentTypes: [],
          minNoticeHours: 24,
          maxAdvanceDays: 60,
          cancellationPolicy: {
            allowClientCancel: true,
            cancelDeadlineHours: 48,
            feeOnLateCancel: 0,
          },
          allowClientReschedule: true,
          rescheduleDeadlineHours: 24,
          createdAt: undefined,
          updatedAt: undefined,
        });
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [businessId, store]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleSave = useCallback(
    async (newSettings: BusinessSettings) => {
      setError(null);
      try {
        await store.save(newSettings);
        setDialogOpen(false);
        await reload();
      } catch (e: any) {
        setError(e.message || 'Failed to save settings');
      }
    },
    [store, reload]
  );

  if (loading) {
    return (
      <Box textAlign="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return (
      <Box p={4}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  if (!settings) return null;

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Business Settings</Typography>
        <Box>
          <Button
            variant="contained"
            sx={{ mr: 2 }}
            onClick={() => setDialogOpen(true)}
          >
            Edit Settings
          </Button>
          <Button
            variant="outlined"
            component={RouterLink}
            to={`/business/${businessId}/settings/availability`}
          >
            Manage Availability
          </Button>
        </Box>
      </Box>

      {/* ... rest of your settings display ... */}

      <BusinessSettingsFormDialog
        open={dialogOpen}
        initialData={settings}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </Box>
  );
}
