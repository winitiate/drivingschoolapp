// src/components/Appointments/AppointmentsTable.tsx

import React from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import type { Appointment } from '../../models/Appointment';

export interface AppointmentsTableProps {
  appointments: Array<
    Appointment & {
      clientName?: string;
      serviceProviderName?: string;
      appointmentTypeName?: string;
    }
  >;
  loading: boolean;
  error: string | null;
  onEdit?: (appt: Appointment) => void;
  onViewAssessment?: (appt: Appointment) => void;
  onDelete?: (appt: Appointment) => void;
  /** When true, shows a Status column on the right */
  showStatusColumn?: boolean;
}

export default function AppointmentsTable({
  appointments,
  loading,
  error,
  onEdit,
  onViewAssessment,
  onDelete,
  showStatusColumn = false,
}: AppointmentsTableProps) {
  if (loading) {
    return (
      <Box textAlign="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" align="center">
        {error}
      </Typography>
    );
  }

  if (!appointments.length) {
    return <Typography align="center">No appointments to display.</Typography>;
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell><strong>Date</strong></TableCell>
          <TableCell><strong>Time</strong></TableCell>
          <TableCell><strong>Client</strong></TableCell>
          <TableCell><strong>Provider</strong></TableCell>
          <TableCell><strong>Type</strong></TableCell>
          {showStatusColumn && <TableCell><strong>Status</strong></TableCell>}
          <TableCell align="center"><strong>Actions</strong></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {appointments.map((appt) => {
          // Handle Firestore Timestamp vs JS Date
          const start = appt.startTime instanceof Date
            ? appt.startTime
            : appt.startTime?.toDate
            ? appt.startTime.toDate()
            : new Date(appt.startTime as any);

          const dateString = start.toLocaleDateString();
          const timeString = start.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <TableRow key={appt.id}>
              <TableCell>{dateString}</TableCell>
              <TableCell>{timeString}</TableCell>
              <TableCell>{appt.clientName || '—'}</TableCell>
              <TableCell>{appt.serviceProviderName || '—'}</TableCell>
              <TableCell>{appt.appointmentTypeName || '—'}</TableCell>
              {showStatusColumn && (
                <TableCell>{appt.status || '—'}</TableCell>
              )}
              <TableCell align="center">
                {onEdit && (
                  <IconButton
                    size="small"
                    onClick={() => onEdit(appt)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
                {onViewAssessment && (
                  <IconButton
                    size="small"
                    onClick={() => onViewAssessment(appt)}
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                )}
                {onDelete && (
                  <IconButton
                    size="small"
                    onClick={() => onDelete(appt)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
