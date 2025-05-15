// src/components/Schools/SchoolsTable.tsx
import React from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody,
  Button, Box, Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { School } from '../../models/School';

interface Props {
  schools: School[];
  loading: boolean;
  error: string | null;
  onUpdateStatus: (id: string, status: School['status']) => void;
  onEdit: (school: School) => void;
}

export default function SchoolsTable({
  schools, loading, error, onUpdateStatus, onEdit
}: Props) {
  if (loading) {
    return <Box textAlign="center" mt={4}><Typography>Loading schools…</Typography></Box>;
  }
  if (error) {
    return <Typography color="error">{error}</Typography>;
  }
  if (schools.length === 0) {
    return <Typography>No schools found.</Typography>;
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
        {schools.map(school => {
          const createdAt = ('toDate' in school.createdAt)
            ? school.createdAt.toDate().toLocaleDateString()
            : school.createdAt.toLocaleDateString();

          return (
            <TableRow key={school.id}>
              <TableCell>{school.name}</TableCell>
              <TableCell>{school.status}</TableCell>
              <TableCell>{school.email}</TableCell>
              <TableCell>{createdAt}</TableCell>
              <TableCell align="center">
                <Box display="flex" gap={1} justifyContent="center">
                  {/* Edit button */}
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => onEdit(school)}
                  >
                    Edit
                  </Button>

                  {/* existing status buttons */}
                  {school.status === 'pending' && (
                    <>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => onUpdateStatus(school.id, 'approved')}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        onClick={() => onUpdateStatus(school.id, 'rejected')}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {school.status === 'approved' && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => onUpdateStatus(school.id, 'rejected')}
                    >
                      Revoke
                    </Button>
                  )}
                  {school.status === 'rejected' && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => onUpdateStatus(school.id, 'pending')}
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
