// src/pages/ServiceProvider/AssessmentPage.tsx

/**
 * Routed page for service providers to assess a single appointment.
 * URL: /service-provider/:serviceProviderId/appointments/:appointmentId/assess
 */

import React from 'react';
import { Box } from '@mui/material';
import AssessmentForm from '../../components/Assessment/AssessmentForm';

export default function AssessmentPage() {
  return (
    <Box maxWidth="md" mx="auto" mt={4}>
      <AssessmentForm />
    </Box>
  );
}
