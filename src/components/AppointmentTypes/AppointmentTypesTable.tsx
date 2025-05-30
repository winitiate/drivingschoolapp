/**
 * AppointmentTypesTable.tsx
 *
 * Presentational table component for listing appointment types.
 * Receives an array of AppointmentType objects and a callback to invoke when
 * the user clicks “Edit” on a row. Doesn’t perform any data fetching—use the
 * AppointmentTypeStore abstraction in the parent to load/save data.
 */

import React from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Box,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { AppointmentType } from "../../models/AppointmentType";

export interface AppointmentTypesTableProps {
  /** Array of appointment types to display */
  appointmentTypes?: AppointmentType[];
  /** Callback when the Edit button is clicked */
  onEdit: (appointmentType: AppointmentType) => void;
}

export default function AppointmentTypesTable({
  appointmentTypes = [],
  onEdit,
}: AppointmentTypesTableProps) {
  if (appointmentTypes.length === 0) {
    return (
      <Box textAlign="center" mt={4}>
        <Typography>No appointment types defined.</Typography>
      </Box>
    );
  }

  const fmtPrice = (cents?: number | null) =>
    cents == null
      ? "-"
      : cents === 0
      ? "Free"
      : `$${(cents / 100).toFixed(2)}`;

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Order</TableCell>
          <TableCell>Title</TableCell>
          <TableCell>Description</TableCell>
          <TableCell>Duration&nbsp;(min)</TableCell>
          <TableCell>Price</TableCell>
          <TableCell align="center">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {appointmentTypes.map((at, index) => (
          <TableRow key={at.id}>
            <TableCell>{at.order ?? index + 1}</TableCell>
            <TableCell>{at.title}</TableCell>
            <TableCell>{at.description || "—"}</TableCell>
            <TableCell>
              {typeof at.durationMinutes === "number"
                ? at.durationMinutes
                : "—"}
            </TableCell>
            <TableCell>{fmtPrice(at.priceCents)}</TableCell>
            <TableCell align="center">
              <IconButton size="small" onClick={() => onEdit(at)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
