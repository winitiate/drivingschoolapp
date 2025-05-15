import React from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, Button } from '@mui/material';
import { Appointment } from '../../models/Appointment';

export interface AppointmentsTableProps {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  onEdit: (appointment: Appointment) => void;
}

export default function AppointmentsTable({ appointments, loading, error, onEdit }: AppointmentsTableProps) {
  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Student Name</TableCell>
          <TableCell>Instructor</TableCell>
          <TableCell>Date</TableCell>
          <TableCell>Time</TableCell>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {appointments.map((appointment) => (
          <TableRow key={appointment.id}>
            <TableCell>{appointment.studentName || 'N/A'}</TableCell>
            <TableCell>{appointment.instructorName || 'N/A'}</TableCell>
            <TableCell>{appointment.date || 'N/A'}</TableCell>
            <TableCell>{appointment.time || 'N/A'}</TableCell>
            <TableCell>
              <Button onClick={() => onEdit(appointment)}>Edit</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
