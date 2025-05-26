// src/pages/Business/Settings/BusinessSettingsManager.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Alert, Table, TableHead, TableBody, TableRow, TableCell, Paper } from '@mui/material';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        // default initial settings
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
        <Button variant="contained" onClick={() => setDialogOpen(true)}>
          Edit Settings
        </Button>
      </Box>

      <Box mb={4}>
        <Typography variant="h6">Advance-booking Window</Typography>
        <Typography>Min notice (hrs): {settings.minNoticeHours}</Typography>
        <Typography>Max advance (days): {settings.maxAdvanceDays}</Typography>
      </Box>

      <Box mb={4}>
        <Typography variant="h6">Cancellation Policy</Typography>
        <Typography>
          Allow client cancel: {settings.cancellationPolicy.allowClientCancel ? 'Yes' : 'No'}
        </Typography>
        <Typography>
          Deadline (hrs): {settings.cancellationPolicy.cancelDeadlineHours}
        </Typography>
        <Typography>
          Fee on late cancel: {settings.cancellationPolicy.feeOnLateCancel}
        </Typography>
      </Box>

      <Box mb={4}>
        <Typography variant="h6">Reschedule Policy</Typography>
        <Typography>Allow reschedule: {settings.allowClientReschedule ? 'Yes' : 'No'}</Typography>
        <Typography>Deadline (hrs): {settings.rescheduleDeadlineHours}</Typography>
      </Box>

      <Box mb={2}>
        <Typography variant="h6">Appointment Types</Typography>
      </Box>
      <Paper variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Duration (mins)</TableCell>
              <TableCell>Buffer Before</TableCell>
              <TableCell>Buffer After</TableCell>
              <TableCell>Price</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {settings.appointmentTypes.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.title}</TableCell>
                <TableCell>{t.durationMinutes}</TableCell>
                <TableCell>{t.bufferBeforeMinutes}</TableCell>
                <TableCell>{t.bufferAfterMinutes}</TableCell>
                <TableCell>{t.price}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <BusinessSettingsFormDialog
        open={dialogOpen}
        initialData={settings}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </Box>
  );
}
