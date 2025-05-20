// src/pages/ServiceLocation/Settings/GradingScales/GradingScalesManager.tsx

/**
 * GradingScalesManager.tsx
 *
 * Admin interface for managing grading scales at a specific service location.
 * Uses the GradingScaleStore abstraction to load and save scales scoped by serviceLocationId.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { useParams } from 'react-router-dom';

import GradingScaleFormDialog from '../../../../components/GradingScales/GradingScaleFormDialog';
import GradingScaleTable from '../../../../components/GradingScales/GradingScaleTable';

import { GradingScale } from '../../../../models/GradingScale';
import { GradingScaleStore } from '../../../../data/GradingScaleStore';
import { FirestoreGradingScaleStore } from '../../../../data/FirestoreGradingScaleStore';

export default function GradingScalesManager() {
  const { serviceLocationId } = useParams<{ serviceLocationId: string }>();

  // Use the abstraction interface
  const store: GradingScaleStore = useMemo(
    () => new FirestoreGradingScaleStore(),
    []
  );

  const [gradingScales, setGradingScales] = useState<GradingScale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GradingScale | null>(null);

  // Reload grading scales scoped to this service location
  const reload = useCallback(async () => {
    if (!serviceLocationId) return;
    setLoading(true);
    setError(null);
    try {
      const list = await store.listByServiceLocation(serviceLocationId);
      setGradingScales(list);
    } catch (e: any) {
      setError(e.message || 'Failed to load grading scales');
    } finally {
      setLoading(false);
    }
  }, [serviceLocationId, store]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleSave = useCallback(
    async (gradingScale: GradingScale) => {
      setError(null);
      try {
        await store.save(gradingScale);
        setDialogOpen(false);
        setEditing(null);
        await reload();
      } catch (e: any) {
        setError(e.message || 'Failed to save grading scale');
      }
    },
    [store, reload]
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Grading Scales</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          Add Grading Scale
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box textAlign="center">
          <CircularProgress />
        </Box>
      ) : (
        <GradingScaleTable
          gradingScales={gradingScales}
          onEdit={(gs) => {
            setEditing(gs);
            setDialogOpen(true);
          }}
        />
      )}

      <GradingScaleFormDialog
        open={dialogOpen}
        serviceLocationId={serviceLocationId!}
        initialData={editing}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </Box>
  );
}
