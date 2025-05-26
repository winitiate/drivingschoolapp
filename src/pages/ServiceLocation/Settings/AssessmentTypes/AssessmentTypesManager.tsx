/**
 * AssessmentTypesManager.tsx
 *
 * Admin interface for managing assessment types at a specific service location.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';

import AssessmentTypeFormDialog from '../../../../components/AssessmentTypes/AssessmentTypeFormDialog';
import AssessmentTypesTable from '../../../../components/AssessmentTypes/AssessmentTypesTable';

import { AssessmentType } from '../../../../models/AssessmentType';
import { AssessmentTypeStore } from '../../../../data/AssessmentTypeStore';
import { FirestoreAssessmentTypeStore } from '../../../../data/FirestoreAssessmentTypeStore';
import { GradingScaleStore } from '../../../../data/GradingScaleStore';
import { FirestoreGradingScaleStore } from '../../../../data/FirestoreGradingScaleStore';

export default function AssessmentTypesManager() {
  const { serviceLocationId } = useParams<{ serviceLocationId: string }>();

  const store: AssessmentTypeStore = useMemo(
    () => new FirestoreAssessmentTypeStore(),
    []
  );
  const gradingScaleStore: GradingScaleStore = useMemo(
    () => new FirestoreGradingScaleStore(),
    []
  );

  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([]);
  const [gradingScales, setGradingScales] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AssessmentType | null>(null);

  const reload = useCallback(async () => {
    if (!serviceLocationId) return;
    setLoading(true);
    setError(null);

    try {
      const list = await store.listByServiceLocation(serviceLocationId);
      // Sort by the true `number` field
      list.sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
      setAssessmentTypes(list);

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

  const handleOrderChange = useCallback(
    async (updatedList: AssessmentType[]) => {
      setError(null);
      try {
        // Persist the new `number` on each record in parallel
        await Promise.all(updatedList.map(item => store.save(item)));

        // Update UI and reload for consistency
        setAssessmentTypes(updatedList);
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
        <AssessmentTypesTable
          assessmentTypes={assessmentTypes}
          gradingScales={gradingScales}
          onEdit={(at) => {
            // always grab the fresh state so `number` is up-to-date
            const fresh = assessmentTypes.find(x => x.id === at.id) || at;
            setEditing(fresh);
            setDialogOpen(true);
          }}
          onOrderChange={handleOrderChange}
        />
      )}

      <AssessmentTypeFormDialog
        open={dialogOpen}
        serviceLocationId={serviceLocationId!}
        initialData={editing}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        gradingScales={gradingScales}
      />
    </Box>
  );
}
