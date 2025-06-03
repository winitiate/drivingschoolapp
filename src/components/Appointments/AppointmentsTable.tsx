// src/components/Appointments/AppointmentsTable.tsx

import React from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Box,
  Typography,
} from "@mui/material";
import { format } from "date-fns";
import type { Appointment } from "../../models/Appointment";
import type { Timestamp } from "firebase/firestore";

export interface AppointmentsTableProps {
  appointments: (Appointment & {
    clientName?: string;
    serviceProviderName?: string;
    appointmentTypeName?: string;
  })[];
  loading: boolean;
  error: string | null;
  onEdit: (appointment: Appointment) => void;
  onAssess?: (appointment: Appointment) => void;
  onViewAssessment?: (appointment: Appointment) => void;
  onDelete?: (appointment: Appointment) => void; // ← Soft-cancel callback
}

/** Converts a Date | Timestamp | string | null to formatted text. */
const fmt = (val: any, pat: string) => {
  if (!val) return "—";
  const d =
    val instanceof Date
      ? val
      : (typeof val === "object" && "toDate" in val)
      ? (val as Timestamp).toDate()
      : new Date(val);
  return isNaN(d.getTime()) ? "—" : format(d, pat);
};

export default function AppointmentsTable({
  appointments,
  loading,
  error,
  onEdit,
  onAssess,
  onViewAssessment,
  onDelete,
}: AppointmentsTableProps) {
  if (loading)
    return (
      <Box textAlign="center" mt={4}>
        <Typography>Loading appointments…</Typography>
      </Box>
    );

  if (error)
    return (
      <Box textAlign="center" mt={4}>
        <Typography color="error">{error}</Typography>
      </Box>
    );

  if (appointments.length === 0)
    return (
      <Box textAlign="center" mt={4}>
        <Typography>No appointments found.</Typography>
      </Box>
    );

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Client</TableCell>
          <TableCell>Service&nbsp;Provider(s)</TableCell>
          <TableCell>Date</TableCell>
          <TableCell>Start</TableCell>
          <TableCell>End</TableCell>
          <TableCell align="center">Actions</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {appointments.map((a) => (
          <TableRow key={a.id}>
            <TableCell>{a.clientName ?? "—"}</TableCell>
            <TableCell>{a.serviceProviderName ?? "—"}</TableCell>
            <TableCell>{fmt(a.startTime, "yyyy-MM-dd")}</TableCell>
            <TableCell>{fmt(a.startTime, "h:mm a")}</TableCell>
            <TableCell>{fmt(a.endTime,   "h:mm a")}</TableCell>

            <TableCell align="center">
              <Box display="flex" justifyContent="center" gap={1} flexWrap="nowrap">
                {/* Edit button */}
                <Button size="small" onClick={() => onEdit(a)}>
                  Edit
                </Button>

                {/* Optional Assess button */}
                {onAssess && (
                  <Button size="small" onClick={() => onAssess(a)}>
                    Assess
                  </Button>
                )}

                {/* Optional View Assessment button */}
                {onViewAssessment && (
                  <Button size="small" onClick={() => onViewAssessment(a)}>
                    View&nbsp;Assessment
                  </Button>
                )}

                {/*
                  The “Cancel” button calls onDelete(a) if provided.
                  It does NOT delete the document itself.
                */}
                {onDelete && (
                  <Button
                    size="small"
                    color="error"
                    onClick={() => onDelete(a)}
                  >
                    Cancel
                  </Button>
                )}
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
