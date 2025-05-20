// src/components/ServiceProviders/ServiceProvidersTable.tsx

/**
 * ServiceProvidersTable.tsx
 *
 * Table component for listing service providers.
 * Shows name and license info, and provides an edit action.
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
import { ServiceProvider } from '../../models/ServiceProvider';

export interface ServiceProvidersTableProps {
  /**
   * Array of service providers to display.
   */
  serviceProviders: ServiceProvider[];
  /**
   * Optional map of userId → user profile data for name/email lookup.
   */
  usersMap?: Record<string, { firstName: string; lastName: string; email: string }>;
  /** Whether data is currently loading */
  loading: boolean;
  /** Error message to display, if any */
  error: string | null;
  /** Callback when the Edit button is clicked for a provider */
  onEdit: (provider: ServiceProvider) => void;
}

export default function ServiceProvidersTable({
  serviceProviders,
  usersMap = {},
  loading,
  error,
  onEdit,
}: ServiceProvidersTableProps) {
  if (loading) {
    return (
      <Box textAlign="center" mt={4}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }
  if (error) {
    return <Typography color="error">{error}</Typography>;
  }
  if (!serviceProviders.length) {
    return <Typography>No service providers found.</Typography>;
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>First Name</TableCell>
          <TableCell>Last Name</TableCell>
          <TableCell>Email</TableCell>
          <TableCell>License #</TableCell>
          <TableCell>License Class</TableCell>
          <TableCell align="center">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {serviceProviders.map((sp) => {
          const user = usersMap[sp.userId] || {
            firstName: '[none]',
            lastName: '',
            email: '',
          };
          return (
            <TableRow key={sp.id}>
              <TableCell>{user.firstName}</TableCell>
              <TableCell>{user.lastName}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{sp.licenseNumber}</TableCell>
              <TableCell>{sp.licenseClass}</TableCell>
              <TableCell align="center">
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => onEdit(sp)}
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
