import React from 'react';
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
import { AssessmentType } from '../../models/AssessmentType';
import { GradingScale } from '../../models/GradingScale';

export interface AssessmentTypesTableProps {
  assessmentTypes: AssessmentType[];
  gradingScales: GradingScale[];
  onEdit: (assessmentType: AssessmentType) => void;
  onOrderChange: (updatedList: AssessmentType[]) => void;
}

export default function AssessmentTypesTable({
  assessmentTypes = [],
  gradingScales = [],
  onEdit,
  onOrderChange,
}: AssessmentTypesTableProps) {
  // Always work with a sorted copy by the true `number` field
  const sorted = [...assessmentTypes].sort(
    (a, b) => (a.number ?? 0) - (b.number ?? 0)
  );

  const moveItem = (from: number, to: number) => {
    const updated = [...sorted];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);

    // Overwrite each item's `number = idx+1`
    const withNewNumber = updated.map((it, idx) => ({
      ...it,
      number: idx + 1,
    }));

    onOrderChange(withNewNumber);
  };

  if (sorted.length === 0) {
    return (
      <Box textAlign="center" mt={4}>
        <Typography>No assessment types defined.</Typography>
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
          <TableCell>Grading Scale</TableCell>
          <TableCell align="center">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {sorted.map((at, idx) => {
          const scale = gradingScales.find(s => s.id === at.gradingScaleId);
          return (
            <TableRow key={at.id}>
              <TableCell>{at.number ?? '-'}</TableCell>
              <TableCell>{at.title}</TableCell>
              <TableCell>{at.description || '-'}</TableCell>
              <TableCell>{scale?.title ?? '-'}</TableCell>
              <TableCell align="center">
                <IconButton onClick={() => onEdit(at)} size="small">
                  <EditIcon fontSize="small" />
                </IconButton>
                {idx > 0 && (
                  <Button size="small" onClick={() => moveItem(idx, idx - 1)}>
                    ↑
                  </Button>
                )}
                {idx < sorted.length - 1 && (
                  <Button size="small" onClick={() => moveItem(idx, idx + 1)}>
                    ↓
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
