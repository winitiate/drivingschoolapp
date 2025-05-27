// src/components/Assessment/AssessmentForm.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  TextField,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';

import type { Appointment } from '../../models/Appointment';
import type { AssessmentType } from '../../models/AssessmentType';
import type { GradingScale } from '../../models/GradingScale';
import type { Assessment } from '../../models/Assessment';

import { FirestoreAppointmentStore }      from '../../data/FirestoreAppointmentStore';
import { FirestoreAssessmentTypeStore }   from '../../data/FirestoreAssessmentTypeStore';
import { FirestoreGradingScaleStore }     from '../../data/FirestoreGradingScaleStore';
import { FirestoreAssessmentStore }       from '../../data/FirestoreAssessmentStore';

export default function AssessmentForm() {
  const { serviceProviderId, appointmentId } = useParams<{
    serviceProviderId: string;
    appointmentId: string;
  }>();
  const navigate = useNavigate();

  // 1) memoize store instances so they don't change each render
  const apptStore = useMemo(() => new FirestoreAppointmentStore(), []);
  const atStore   = useMemo(() => new FirestoreAssessmentTypeStore(), []);
  const gsStore   = useMemo(() => new FirestoreGradingScaleStore(), []);
  const asStore   = useMemo(() => new FirestoreAssessmentStore(), []);

  const [appointment,      setAppointment]      = useState<Appointment | null>(null);
  const [assessmentTypes,  setAssessmentTypes]  = useState<AssessmentType[]>([]);
  const [gradingScales,    setGradingScales]    = useState<GradingScale[]>([]);
  const [existing,         setExisting]         = useState<Assessment | null>(null);

  const [ratings,          setRatings]          = useState<Record<string, number>>({});
  const [comments,         setComments]         = useState('');
  const [loading,          setLoading]          = useState(true);
  const [saving,           setSaving]           = useState(false);
  const [error,            setError]            = useState<string | null>(null);

  // 2) effect now only depends on `appointmentId` (and the stable stores)
  useEffect(() => {
    async function loadAll() {
      if (!appointmentId) return;
      setLoading(true);
      try {
        const appt = await apptStore.getById(appointmentId);
        if (!appt) throw new Error('Appointment not found');
        setAppointment(appt);

        const locId =
          (appt as any).serviceLocationId ||
          (appt as any).serviceLocationIds?.[0];
        const [ats, gss, exs] = await Promise.all([
          atStore.listByServiceLocation(locId),
          gsStore.listByServiceLocation(locId),
          asStore.listByAppointment(appointmentId),
        ]);

        // sort by saved `number`
        ats.sort((a, b) => (a.number ?? 0) - (b.number ?? 0));

        setAssessmentTypes(ats);
        setGradingScales(gss);

        const ex = exs[0] || null;
        setExisting(ex);
        setComments(ex?.comments || '');

        // initialize ratings
        const init: Record<string, number> = {};
        ats.forEach((at) => {
          const crit = ex?.criteria.find((c) => c.name === at.title);
          const scale = gss.find((s) => s.id === at.gradingScaleId);
          const maxLevel = (scale?.levels.length ?? 1) - 1;
          init[at.id] =
            ex
              ? Math.min(Math.max(0, crit?.rating ?? 0), maxLevel)
              : 0;
        });
        setRatings(init);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
    // run only when appointmentId changes
  }, [appointmentId, apptStore, atStore, gsStore, asStore]);

  const updateRating = useCallback((typeId: string, newVal: number) => {
    setRatings((r) => ({ ...r, [typeId]: newVal }));
  }, []);

  const handleSave = async () => {
    if (!appointmentId || !serviceProviderId) return;
    setSaving(true);
    setError(null);
    try {
      const id = existing?.id || uuidv4();
      const criteria = assessmentTypes.map((at) => ({
        name: at.title,
        rating: ratings[at.id] ?? 0,
        description: at.description,
      }));
      const sum = Object.values(ratings).reduce((a, b) => a + b, 0);
      const overall = Math.round(sum / assessmentTypes.length);

      const payload: Assessment = {
        id,
        appointmentId,
        createdBy: serviceProviderId,
        criteria,
        overallRating: overall,
        comments,
        attachments: [],
        createdAt: existing?.createdAt,
        updatedAt: existing?.updatedAt,
      };
      await asStore.save(payload);
      navigate(-1);
    } catch (e: any) {
      setError(e.message);
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
  if (error) {
    return (
      <Box textAlign="center" mt={4}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Assess Appointment
        </Typography>

        {assessmentTypes.map((at) => {
          const scale = gradingScales.find((s) => s.id === at.gradingScaleId);
          const levels = scale?.levels || [];
          const idx = ratings[at.id] ?? 0;
          return (
            <Box key={at.id} display="flex" alignItems="center" mb={2}>
              <Button
                variant="outlined"
                onClick={() => updateRating(at.id, Math.max(0, idx - 1))}
                disabled={idx <= 0}
              >
                –
              </Button>
              <Box flexGrow={1} textAlign="center" mx={2}>
                <Typography>{at.title}</Typography>
                <Typography variant="subtitle1">
                  {levels[idx]?.description ?? idx}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                onClick={() =>
                  updateRating(at.id, Math.min((levels.length || 1) - 1, idx + 1))
                }
                disabled={idx >= (levels.length || 1) - 1}
              >
                +
              </Button>
            </Box>
          );
        })}

        <TextField
          label="Comments"
          fullWidth
          multiline
          rows={4}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          sx={{ mt: 2 }}
        />
      </CardContent>

      <CardActions>
        <Button onClick={() => navigate(-1)}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </CardActions>
    </Card>
  );
}
