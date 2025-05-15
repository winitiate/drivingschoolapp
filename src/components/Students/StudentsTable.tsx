import React from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody,
  Button, Box, Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { Student } from '../../models/Student';

export interface StudentsTableProps {
  students: Student[];
  usersMap?: Record<string, { firstName: string; lastName: string; email: string }>;
  loading: boolean;
  error: string | null;
  onEdit: (stu: Student) => void;
}

export default function StudentsTable({
  students,
  usersMap = {},
  loading,
  error,
  onEdit
}: StudentsTableProps) {
  if (loading) {
    return <Box textAlign="center" mt={4}><Typography>Loading…</Typography></Box>;
  }
  if (error) {
    return <Typography color="error">{error}</Typography>;
  }
  if (!students.length) {
    return <Typography>No students found.</Typography>;
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
        {students.map(stu => {
          const user = usersMap[stu.userId] || { firstName: '', lastName: '', email: '' };
          return (
            <TableRow key={stu.id}>
              <TableCell>{user.firstName}</TableCell>
              <TableCell>{user.lastName}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell align="center">
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => onEdit(stu)}
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
