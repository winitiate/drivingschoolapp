// src/pages/ServiceLocation/Settings/AppointmentTypes/AppointmentTypesManager.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';

import AppointmentTypeFormDialog   from '../../../../components/AppointmentTypes/AppointmentTypeFormDialog';
import AppointmentTypesTable       from '../../../../components/AppointmentTypes/AppointmentTypesTable';

import { AppointmentType }         from '../../../../models/AppointmentType';
import { AppointmentTypeStore }    from '../../../../data/AppointmentTypeStore';
import { FirestoreAppointmentTypeStore } from '../../../../data/FirestoreAppointmentTypeStore';

import { AssessmentType }          from '../../../../models/AssessmentType';
import { AssessmentTypeStore }     from '../../../../data/AssessmentTypeStore';
import { FirestoreAssessmentTypeStore } from '../../../../data/FirestoreAssessmentTypeStore';

export default function AppointmentTypesManager() {
  const { serviceLocationId } = useParams<{ serviceLocationId: string }>();

  // Stores
  const apptStore: AppointmentTypeStore = useMemo(
    () => new FirestoreAppointmentTypeStore(),
    []
  );
  const assessStore: AssessmentTypeStore = useMemo(
    () => new FirestoreAssessmentTypeStore(),
    []
  );

  // Local state
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [assessmentOptions, setAssessmentOptions] = useState<AssessmentType[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing]   = useState<AppointmentType | null>(null);

  // Load both appt‐ and assessment‐types
  const reload = useCallback(async () => {
    if (!serviceLocationId) return;
    setLoading(true);
    setError(null);

    try {
      // 1) appointment types
      const appts = await apptStore.listByServiceLocation(serviceLocationId);
      appts.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setAppointmentTypes(appts);

      // 2) assessment types
      const assesses = await assessStore.listByServiceLocation(serviceLocationId);
      setAssessmentOptions(assesses);
    } catch (e: any) {
      setError(e.message || 'Failed to load types');
    } finally {
      setLoading(false);
    }
  }, [serviceLocationId, apptStore, assessStore]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Save (from dialog), including any manual order & linked assessments
  const handleSave = useCallback(
    async (appt: AppointmentType) => {
      setError(null);
      try {
        // Normalize undefined → null to satisfy Firestore
        const payload: AppointmentType = {
          ...appt,
          durationMinutes:  appt.durationMinutes ?? null,
          price:            appt.price ?? null,
          order:            appt.order ?? null,
          assessmentTypeIds: appt.assessmentTypeIds ?? [],
        };
        await apptStore.save(payload);

        setDialogOpen(false);
        setEditing(null);
        await reload();
      } catch (e: any) {
        setError(e.message || 'Failed to save appointment type');
      }
    },
    [apptStore, reload]
  );

  // Persist arrow‐driven reorder
  const handleOrderChange = useCallback(
    async (updatedList: AppointmentType[]) => {
      setError(null);
      try {
        const toSave = updatedList.map((it, idx) => ({
          ...it,
          order: idx + 1,
        }));
        await Promise.all(toSave.map(item => apptStore.save(item)));

        setAppointmentTypes(toSave);
        await reload();
      } catch (e: any) {
        setError(e.message || 'Failed to update order');
      }
    },
    [apptStore, reload]
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Appointment Types</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          Add Appointment Type
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box textAlign="center"><CircularProgress /></Box>
      ) : (
        <AppointmentTypesTable
          appointmentTypes={appointmentTypes}
          onEdit={at => {
            // Pull the latest version so order & linked IDs are fresh
            const fresh = appointmentTypes.find(x => x.id === at.id) || at;
            setEditing(fresh);
            setDialogOpen(true);
          }}
          onOrderChange={handleOrderChange}
        />
      )}

      <AppointmentTypeFormDialog
        open={dialogOpen}
        serviceLocationId={serviceLocationId!}
        initialData={editing}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        assessmentTypes={assessmentOptions}
      />
    </Box>
  );
}
