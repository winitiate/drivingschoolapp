// src/components/ServiceLocations/ServiceLocationsTable.tsx

/**
 * ServiceLocationsTable.tsx
 *
 * Table component for listing service locations.
 * Shows name, status, contact email, creation date, and provides edit/status actions.
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
import EditIcon from '@mui/icons-material/Edit';
import { ServiceLocation } from '../../models/ServiceLocation';

export interface ServiceLocationsTableProps {
  /**
   * Array of service locations to display.
   */
  serviceLocations: ServiceLocation[];
  /** Whether data is currently loading */
  loading: boolean;
  /** Error message to display, if any */
  error: string | null;
  /**
   * Callback when the status update button is clicked.
   * @param id     ID of the location
   * @param status New status ("pending" | "approved" | "rejected")
   */
  onUpdateStatus: (id: string, status: ServiceLocation['status']) => void;
  /** Callback when the Edit button is clicked for a location */
  onEdit: (location: ServiceLocation) => void;
}

export default function ServiceLocationsTable({
  serviceLocations,
  loading,
  error,
  onUpdateStatus,
  onEdit,
}: ServiceLocationsTableProps) {
  if (loading) {
    return (
      <Box textAlign="center" mt={4}>
        <Typography>Loading service locations…</Typography>
      </Box>
    );
  }
  if (error) {
    return <Typography color="error">{error}</Typography>;
  }
  if (!serviceLocations.length) {
    return <Typography>No service locations found.</Typography>;
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Email</TableCell>
          <TableCell>Created At</TableCell>
          <TableCell align="center">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {serviceLocations.map((loc) => {
          const createdAt = loc.createdAt instanceof Date
            ? loc.createdAt.toLocaleDateString()
            : 'toDate' in loc.createdAt
              ? loc.createdAt.toDate().toLocaleDateString()
              : '';

          return (
            <TableRow key={loc.id}>
              <TableCell>{loc.name}</TableCell>
              <TableCell>{loc.status}</TableCell>
              <TableCell>{loc.email}</TableCell>
              <TableCell>{createdAt}</TableCell>
              <TableCell align="center">
                <Box display="flex" gap={1} justifyContent="center">
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => onEdit(loc)}
                  >
                    Edit
                  </Button>
                  {loc.status === 'pending' && (
                    <>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => onUpdateStatus(loc.id, 'approved')}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        onClick={() => onUpdateStatus(loc.id, 'rejected')}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {loc.status === 'approved' && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => onUpdateStatus(loc.id, 'rejected')}
                    >
                      Revoke
                    </Button>
                  )}
                  {loc.status === 'rejected' && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => onUpdateStatus(loc.id, 'pending')}
                    >
                      Re-queue
                    </Button>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
