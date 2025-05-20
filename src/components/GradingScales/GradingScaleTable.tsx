// src/components/GradingScales/GradingScalesTable.tsx

/**
 * GradingScalesTable.tsx
 *
 * Presentational table component for listing grading scales.
 * Receives an array of GradingScale objects and a callback to invoke when
 * the user clicks “Edit” on a row. Doesn’t perform any data fetching itself—
 * use the gradingScaleStore abstraction in the parent to load/save data.
 */

import React from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { GradingScale } from '../../models/GradingScale';

export interface GradingScalesTableProps {
  /** Array of grading scales to display */
  gradingScales: GradingScale[];
  /** Callback when the Edit button is clicked */
  onEdit: (gradingScale: GradingScale) => void;
}

export default function GradingScalesTable({
  gradingScales,
  onEdit,
}: GradingScalesTableProps) {
  if (gradingScales.length === 0) {
    return <Box textAlign="center" mt={4}><Typography>No grading scales defined.</Typography></Box>;
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Title</TableCell>
          <TableCell>Levels (Number – Description)</TableCell>
          <TableCell align="center">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {gradingScales.map((gs) => (
          <TableRow key={gs.id}>
            <TableCell>{gs.title}</TableCell>
            <TableCell>
              {gs.levels.map((level, idx) => (
                <div key={idx}>
                  {typeof level === 'object' && 'level' in level && 'description' in level
                    ? `${level.level} – ${level.description}`
                    : level
                  }
                </div>
              ))}
            </TableCell>
            <TableCell align="center">
              <IconButton onClick={() => onEdit(gs)} size="small">
                <EditIcon fontSize="small" />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
