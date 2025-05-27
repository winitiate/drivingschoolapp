// src/components/Assessment/AssessmentView.tsx

import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, CircularProgress, Alert } from '@mui/material';

import type { Assessment } from '../../models/Assessment';
import { FirestoreAssessmentStore } from '../../data/FirestoreAssessmentStore';

interface AssessmentViewProps {
  appointmentId: string;
}

export default function AssessmentView({ appointmentId }: AssessmentViewProps) {
  const asStore = new FirestoreAssessmentStore();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const arr = await asStore.listByAppointment(appointmentId);
        setAssessment(arr[0] || null);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [appointmentId]);

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
  if (!assessment) {
    return (
      <Typography variant="body1" color="textSecondary">
        No assessment completed yet.
      </Typography>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">Assessment Results</Typography>

        {assessment.criteria.map((c, i) => (
          <Box key={i} mb={1}>
            <Typography variant="subtitle2">{c.name}</Typography>
            <Typography variant="body2">
              Level {c.rating}: {c.description}
            </Typography>
          </Box>
        ))}

        <Box mt={2}>
          <Typography variant="subtitle2">Overall Rating</Typography>
          <Typography variant="body1">{assessment.overallRating}</Typography>
        </Box>

        {assessment.comments && (
          <Box mt={2}>
            <Typography variant="subtitle2">Comments</Typography>
            <Typography variant="body2">{assessment.comments}</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
