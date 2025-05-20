// src/components/AssessmentTypes/AssessmentTypeFormDialog.tsx

/**
 * AssessmentTypeFormDialog.tsx
 *
 * Modal dialog for creating or editing an assessment type.
 * - Captures title, description, order, and associated grading scale.
 * - Scopes the assessment type to a specific service location.
 * - Passes the completed AssessmentType object back via onSave;
 *   parent components should use the assessmentTypeStore abstraction
 *   to persist the data.
 *
 * Props:
 *  • open: boolean — whether the dialog is visible  
 *  • serviceLocationId: string — ID of the current service location  
 *  • initialData?: AssessmentType | null — existing data for edit mode  
 *  • onClose(): void — callback to close the dialog  
 *  • onSave(at: AssessmentType): void — callback after save  
 *  • gradingScales: Array<{ id: string; title: string }> — available scales  
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Box,
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import type { AssessmentType } from '../../models/AssessmentType';

export interface AssessmentTypeFormDialogProps {
  open: boolean;
  serviceLocationId: string;
  initialData?: AssessmentType | null;
  onClose: () => void;
  onSave: (assessmentType: AssessmentType) => void;
  gradingScales: { id: string; title: string }[];
}

export default function AssessmentTypeFormDialog({
  open,
  serviceLocationId,
  initialData,
  onClose,
  onSave,
  gradingScales,
}: AssessmentTypeFormDialogProps) {
  const isEdit = Boolean(initialData?.id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState<number | ''>('');
  const [gradingScaleId, setGradingScaleId] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setOrder(initialData.number ?? '');
      setGradingScaleId(initialData.gradingScaleId || '');
    } else {
      setTitle('');
      setDescription('');
      setOrder('');
      setGradingScaleId('');
    }
  }, [initialData]);

  const handleSubmit = () => {
    const at: AssessmentType = {
      id: initialData?.id || uuidv4(),
      serviceLocationId,
      title,
      description,
      number: order === '' ? undefined : Number(order),
      gradingScaleId,
    };
    onSave(at);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {isEdit ? 'Edit Assessment Type' : 'Add Assessment Type'}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Title"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Description"
              fullWidth
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Order (optional)"
              type="number"
              fullWidth
              value={order}
              onChange={(e) =>
                setOrder(e.target.value === '' ? '' : Number(e.target.value))
              }
            />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ minWidth: 300 }}>
              <TextField
                select
                label="Grading Scale"
                fullWidth
                value={gradingScaleId}
                onChange={(e) => setGradingScaleId(e.target.value)}
              >
                {gradingScales.map((gs) => (
                  <MenuItem key={gs.id} value={gs.id}>
                    {gs.title}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
