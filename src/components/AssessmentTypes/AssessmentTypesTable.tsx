// src/components/AppointmentTypes/AppointmentTypesTable.tsx

/**
 * AppointmentTypesTable.tsx
 *
 * Presentational table component for listing appointment types.
 * Receives an array of AppointmentType objects and callbacks to invoke when
 * the user clicks “Edit” or reorders the list. Doesn’t perform any data fetching—
 * use the appointmentTypeStore abstraction in the parent to load/save/reorder data.
 */

import React, { useState, useEffect } from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Button,
  Box,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { AppointmentType } from '../../models/AppointmentType';

export interface AppointmentTypesTableProps {
  /** Array of appointment types to display */
  appointmentTypes: AppointmentType[];
  /** Callback when the Edit button is clicked */
  onEdit: (appointmentType: AppointmentType) => void;
  /**
   * Callback when the user reorders items.
   * Receives the updated array with new `order` fields.
   */
  onOrderChange: (updatedList: AppointmentType[]) => void;
}

export default function AppointmentTypesTable({
  appointmentTypes,
  onEdit,
  onOrderChange,
}: AppointmentTypesTableProps) {
  const [items, setItems] = useState<AppointmentType[]>([]);

  useEffect(() => {
    // initialize `order` based on array position
    const ordered = appointmentTypes.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));
    setItems(ordered);
  }, [appointmentTypes]);

  const moveItem = (from: number, to: number) => {
    const updated = [...items];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    const withNewOrder = updated.map((it, idx) => ({
      ...it,
      order: idx + 1,
    }));
    setItems(withNewOrder);
    onOrderChange(withNewOrder);
  };

  if (items.length === 0) {
    return (
      <Box textAlign="center" mt={4}>
        <Typography>No appointment types defined.</Typography>
      </Box>
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Order</TableCell>
          <TableCell>Title</TableCell>
          <TableCell>Description</TableCell>
          <TableCell>Duration (min)</TableCell>
          <TableCell>Price</TableCell>
          <TableCell align="center">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((at, idx) => (
          <TableRow key={at.id}>
            <TableCell>{at.order}</TableCell>
            <TableCell>{at.title}</TableCell>
            <TableCell>{at.description || '-'}</TableCell>
            <TableCell>{at.durationMinutes ?? '-'}</TableCell>
            <TableCell>
              {at.price != null ? `$${at.price.toFixed(2)}` : '-'}
            </TableCell>
            <TableCell align="center">
              <IconButton onClick={() => onEdit(at)} size="small">
                <EditIcon fontSize="small" />
              </IconButton>
              {idx > 0 && (
                <Button size="small" onClick={() => moveItem(idx, idx - 1)}>
                  ↑
                </Button>
              )}
              {idx < items.length - 1 && (
                <Button size="small" onClick={() => moveItem(idx, idx + 1)}>
                  ↓
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
