// src/components/Appointments/AppointmentsTable.tsx

/**
 * AppointmentsTable.tsx
 *
 * Presentational table component for listing appointments.
 * Receives an array of Appointment objects—each enriched with
 * `clientName` and `serviceProviderName`—and callbacks to invoke
 * when the user clicks “Edit”. Doesn’t perform any data fetching—
 * parent components should use the appointmentStore abstraction
 * to load/save data.
 */

import React from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Box,
  Typography,
} from '@mui/material';
import type { Appointment } from '../../models/Appointment';

export interface AppointmentsTableProps {
  /** Array of appointments to display */
  appointments: Appointment[];
  /** Whether data is currently loading */
  loading: boolean;
  /** Error message to display, if any */
  error: string | null;
  /** Callback when the Edit button is clicked */
  onEdit: (appointment: Appointment) => void;
}

export default function AppointmentsTable({
  appointments,
  loading,
  error,
  onEdit,
}: AppointmentsTableProps) {
  if (loading) {
    return (
      <Box textAlign="center" mt={4}>
        <Typography>Loading appointments…</Typography>
      </Box>
    );
  }
  if (error) {
    return (
      <Box textAlign="center" mt={4}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }
  if (appointments.length === 0) {
    return (
      <Box textAlign="center" mt={4}>
        <Typography>No appointments found.</Typography>
      </Box>
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Client</TableCell>
          <TableCell>Service Provider</TableCell>
          <TableCell>Date</TableCell>
          <TableCell>Time</TableCell>
          <TableCell align="center">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {appointments.map((appt) => (
          <TableRow key={appt.id}>
            <TableCell>{appt.clientName ?? '—'}</TableCell>
            <TableCell>{appt.serviceProviderName ?? '—'}</TableCell>
            <TableCell>{appt.date ?? '—'}</TableCell>
            <TableCell>{appt.time ?? '—'}</TableCell>
            <TableCell align="center">
              <Button size="small" onClick={() => onEdit(appt)}>
                Edit
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
