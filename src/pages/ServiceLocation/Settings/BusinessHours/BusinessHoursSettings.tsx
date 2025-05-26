// src/pages/ServiceLocation/Settings/BusinessHours/BusinessHoursSettings.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import { useParams } from 'react-router-dom';

import { ServiceLocation } from '../../../../models/ServiceLocation';
import { ServiceLocationStore } from '../../../../data/ServiceLocationStore';
import { FirestoreServiceLocationStore } from '../../../../data/FirestoreServiceLocationStore';

type Hours = { open: string; close: string };

const DAYS: Array<{ key: keyof ServiceLocation['businessHours']; label: string }> = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

export default function BusinessHoursSettings() {
  const { serviceLocationId } = useParams<{ serviceLocationId: string }>();
  const store: ServiceLocationStore = useMemo(
    () => new FirestoreServiceLocationStore(),
    []
  );

  const [businessHours, setBusinessHours] = useState<Partial<Record<keyof ServiceLocation['businessHours'], Hours>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!serviceLocationId) return;
    setLoading(true);
    setError(null);
    try {
      const loc = await store.getById(serviceLocationId);
      const initial: Record<string, Hours> = {};
      DAYS.forEach(({ key }) => {
        initial[key] = loc?.businessHours?.[key] ?? { open: '', close: '' };
      });
      setBusinessHours(initial);
    } catch (e: any) {
      setError(e.message || 'Failed to load business hours');
    } finally {
      setLoading(false);
    }
  }, [serviceLocationId, store]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (
    dayKey: keyof ServiceLocation['businessHours'],
    field: keyof Hours,
    value: string
  ) => {
    setBusinessHours(prev => ({
      ...prev,
      [dayKey]: {
        ...(prev[dayKey] ?? { open: '', close: '' }),
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!serviceLocationId) return;
    setSaving(true);
    setError(null);
    try {
      const loc = (await store.getById(serviceLocationId)) as ServiceLocation;
      await store.save({
        ...loc,
        businessHours: businessHours as ServiceLocation['businessHours'],
      });
    } catch (e: any) {
      setError(e.message || 'Failed to save business hours');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box textAlign="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Typography variant="h5" gutterBottom>
        Business Hours
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Day</TableCell>
              <TableCell>Open</TableCell>
              <TableCell>Close</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {DAYS.map(({ key, label }, idx) => (
              <TableRow
                key={key}
                sx={{
                  '&:nth-of-type(odd)': { backgroundColor: 'action.hover' },
                }}
              >
                <TableCell>{label}</TableCell>
                <TableCell>
                  <TextField
                    type="time"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={businessHours[key]?.open || ''}
                    onChange={e => handleChange(key, 'open', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="time"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={businessHours[key]?.close || ''}
                    onChange={e => handleChange(key, 'close', e.target.value)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
        <Button onClick={load} disabled={loading || saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </Box>
    </Box>
  );
}
