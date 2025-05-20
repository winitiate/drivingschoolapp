// src/pages/ServiceLocation/Settings/AssessmentTypes/AssessmentTypesManager.tsx

/**
 * AssessmentTypesManager.tsx
 *
 * Admin interface for managing assessment types at a specific service location.
 * Uses the AssessmentTypeStore abstraction to load and save assessment types,
 * scoped by serviceLocationId, and GradingScaleStore to load available grading scales.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';

import AssessmentTypeFormDialog from '../../../../components/AssessmentTypes/AssessmentTypeFormDialog';
import AssessmentTypeTable from '../../../../components/AssessmentTypes/AssessmentTypesTable';

import { AssessmentType } from '../../../../models/AssessmentType';
import { AssessmentTypeStore } from '../../../../data/AssessmentTypeStore';
import { FirestoreAssessmentTypeStore } from '../../../../data/FirestoreAssessmentTypeStore';
import { GradingScaleStore } from '../../../../data/GradingScaleStore';
import { FirestoreGradingScaleStore } from '../../../../data/FirestoreGradingScaleStore';

export default function AssessmentTypesManager() {
  const { serviceLocationId } = useParams<{ serviceLocationId: string }>();

  // Abstraction stores
  const store: AssessmentTypeStore = useMemo(
    () => new FirestoreAssessmentTypeStore(),
    []
  );
  const gradingScaleStore: GradingScaleStore = useMemo(
    () => new FirestoreGradingScaleStore(),
    []
  );

  // Local state
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([]);
  const [gradingScales, setGradingScales] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AssessmentType | null>(null);

  // Reload data scoped to this service location
  const reload = useCallback(async () => {
    if (!serviceLocationId) return;
    setLoading(true);
    setError(null);
    try {
      // Load assessment types for this location
      const list = await store.listByServiceLocation(serviceLocationId);
      setAssessmentTypes(list);

      // Load all grading scales for the dropdown
      const scales = await gradingScaleStore.listAll();
      setGradingScales(scales.map(gs => ({ id: gs.id, title: gs.title })));
    } catch (e: any) {
      setError(e.message || 'Failed to load assessment types or grading scales');
    } finally {
      setLoading(false);
    }
  }, [serviceLocationId, store, gradingScaleStore]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Save or update an assessment type
  const handleSave = useCallback(
    async (assessmentType: AssessmentType) => {
      setError(null);
      try {
        await store.save(assessmentType);
        setDialogOpen(false);
        setEditing(null);
        await reload();
      } catch (e: any) {
        setError(e.message || 'Failed to save assessment type');
      }
    },
    [store, reload]
  );

  // Reorder assessment types (if supported)
  const handleOrderChange = useCallback(
    async (updatedOrder: AssessmentType[]) => {
      setError(null);
      try {
        // Optimistically update UI
        setAssessmentTypes(updatedOrder);

        // Persist new order values
        for (let i = 0; i < updatedOrder.length; i++) {
          const updated = { ...updatedOrder[i], number: i + 1 };
          await store.save(updated);
        }

        // Reload to ensure consistency
        await reload();
      } catch (e: any) {
        setError(e.message || 'Failed to update order');
      }
    },
    [store, reload]
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Assessment Types</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          Add Assessment Type
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
        <AssessmentTypeTable
          assessmentTypes={assessmentTypes}
          onEdit={(at) => {
            setEditing(at);
            setDialogOpen(true);
          }}
          onOrderChange={handleOrderChange}
        />
      )}

      <AssessmentTypeFormDialog
        open={dialogOpen}
        serviceLocationId={serviceLocationId!}
        initialData={editing || null}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        gradingScales={gradingScales}
      />
    </Box>
  );
}
