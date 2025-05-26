// src/pages/ServiceLocation/LocationSettingsManager.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
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

import { ServiceLocation } from '../../models/ServiceLocation';
import { AppointmentType } from '../../models/AppointmentType';
import { FirestoreServiceLocationStore } from '../../data/FirestoreServiceLocationStore';
import LocationSettingsFormDialog from '../../components/ServiceLocations/LocationSettingsFormDialog';

export default function LocationSettingsManager() {
  const { businessId, serviceLocationId } = useParams<{
    businessId: string;
    serviceLocationId: string;
  }>();
  const store = useMemo(() => new FirestoreServiceLocationStore(), []);

  const [location, setLocation] = useState<ServiceLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const reload = useCallback(async () => {
    if (!serviceLocationId) return;
    setLoading(true);
    setError(null);
    try {
      const loc = await store.getById(serviceLocationId);
      setLocation(loc);
    } catch (e: any) {
      setError(e.message || 'Failed to load location');
    } finally {
      setLoading(false);
    }
  }, [serviceLocationId, store]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleSave = useCallback(
    async (updated: ServiceLocation) => {
      setError(null);
      try {
        await store.save(updated);
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
  if (!location) return null;

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          Settings for “{location.name}”
        </Typography>
        <Button variant="contained" onClick={() => setDialogOpen(true)}>
          Edit Settings
        </Button>
      </Box>

      <Box mb={3}>
        <Typography variant="h6">Appointment Types Override</Typography>
        <Typography>
          Override enabled:{' '}
          {location.allowAppointmentTypeOverride ? 'Yes' : 'No'}
        </Typography>
        {location.allowAppointmentTypeOverride && (
          <Paper variant="outlined" sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Buffer Before</TableCell>
                  <TableCell>Buffer After</TableCell>
                  <TableCell>Price</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(location.locationAppointmentTypes || []).map((t: AppointmentType) => (
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
        )}
      </Box>

      <Box mb={3}>
        <Typography variant="h6">Booking Window Override</Typography>
        <Typography>
          Override enabled:{' '}
          {location.allowNoticeWindowOverride ? 'Yes' : 'No'}
        </Typography>
        {location.allowNoticeWindowOverride && (
          <Box sx={{ mt: 1 }}>
            <Typography>Min notice (hrs): {location.minNoticeHours}</Typography>
            <Typography>Max advance (days): {location.maxAdvanceDays}</Typography>
          </Box>
        )}
      </Box>

      <LocationSettingsFormDialog
        open={dialogOpen}
        initialData={location}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </Box>
  );
}
