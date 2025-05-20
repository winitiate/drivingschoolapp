// src/components/Clients/ClientsTable.tsx

/**
 * ClientsTable.tsx
 *
 * Presentational table component for listing clients.
 * Receives an array of Client objects and a callback to invoke when
 * the user clicks “Edit” on a row. Doesn’t perform any data fetching itself—
 * use the clientStore abstraction in the parent to load/save data.
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
import { Client } from '../../models/Client';

export interface ClientsTableProps {
  /** Array of clients to display */
  clients: Client[];
  /**
   * Optional map of userId → user profile data for name/email lookup.
   * e.g. { [userId]: { firstName, lastName, email } }
   */
  usersMap?: Record<string, { firstName: string; lastName: string; email: string }>;
  /** Whether data is currently loading */
  loading: boolean;
  /** Error message to display, if any */
  error: string | null;
  /** Callback when the Edit button is clicked for a client */
  onEdit: (client: Client) => void;
}

export default function ClientsTable({
  clients,
  usersMap = {},
  loading,
  error,
  onEdit,
}: ClientsTableProps) {
  if (loading) {
    return (
      <Box textAlign="center" mt={4}>
        <Typography>Loading…</Typography>
      </Box>
    );
  }
  if (error) {
    return <Typography color="error">{error}</Typography>;
  }
  if (!clients.length) {
    return <Typography>No clients found.</Typography>;
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>First Name</TableCell>
          <TableCell>Last Name</TableCell>
          <TableCell>Email</TableCell>
          <TableCell align="center">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {clients.map((client) => {
          const user = usersMap[client.userId] || {
            firstName: '',
            lastName: '',
            email: '',
          };
          return (
            <TableRow key={client.id}>
              <TableCell>{user.firstName}</TableCell>
              <TableCell>{user.lastName}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell align="center">
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => onEdit(client)}
                >
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
