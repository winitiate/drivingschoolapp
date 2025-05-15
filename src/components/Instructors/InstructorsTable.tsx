import React from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody,
  Button, Box, Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { Instructor } from '../../models/Instructor';

export interface InstructorsTableProps {
  instructors: Instructor[];
  usersMap?: Record<string, { firstName: string; lastName: string; email: string }>;
  loading: boolean;
  error: string | null;
  onEdit: (inst: Instructor) => void;
}

export default function InstructorsTable({
  instructors,
  usersMap = {},
  loading,
  error,
  onEdit
}: InstructorsTableProps) {
  if (loading) {
    return <Box textAlign="center" mt={4}><Typography>Loading...</Typography></Box>;
  }
  if (error) {
    return <Typography color="error">{error}</Typography>;
  }
  if (!instructors.length) {
    return <Typography>No instructors found.</Typography>;
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>First Name</TableCell>
          <TableCell>Last Name</TableCell>
          <TableCell>Email</TableCell>
          <TableCell>Licence#</TableCell>
          <TableCell>Class</TableCell>
          <TableCell align="center">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {instructors.map(inst => {
          const user = usersMap[inst.userId] || { firstName: '[none]', lastName: '', email: '' };
          return (
            <TableRow key={inst.id}>
              <TableCell>{user.firstName}</TableCell>
              <TableCell>{user.lastName}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{inst.licenceNumber}</TableCell>
              <TableCell>{inst.licenceClass}</TableCell>
              <TableCell align="center">
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => onEdit(inst)}
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
