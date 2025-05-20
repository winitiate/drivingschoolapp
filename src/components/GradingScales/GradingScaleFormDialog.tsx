// src/components/GradingScales/GradingScaleFormDialog.tsx

/**
 * GradingScaleFormDialog.tsx
 *
 * Modal dialog for creating or editing a grading scale.
 * - Captures title and an ordered list of { level, description } items.
 * - Scopes the scale to a specific service location.
 * - Persists via the gradingScaleStore abstraction.
 *
 * Props:
 *  • open: boolean — whether the dialog is visible  
 *  • serviceLocationId: string — ID of the current service location  
 *  • initialData?: GradingScale | null — existing scale data for edit mode  
 *  • onClose(): void — callback to close the dialog  
 *  • onSave(scale: GradingScale): void — callback after successful save  
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
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';

import type { GradingScale } from '../../models/GradingScale';
import { gradingScaleStore } from '../../data';

export interface GradingScaleFormDialogProps {
  open: boolean;
  serviceLocationId: string;
  initialData?: GradingScale | null;
  onClose: () => void;
  onSave: (gradingScale: GradingScale) => void;
}

export default function GradingScaleFormDialog({
  open,
  serviceLocationId,
  initialData,
  onClose,
  onSave,
}: GradingScaleFormDialogProps) {
  const isEdit = Boolean(initialData?.id);

  const [title, setTitle] = useState('');
  const [levels, setLevels] = useState<{ level: number; description: string }[]>([]);

  // Seed form on open/edit
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      // Normalize older flat-format if needed
      const parsedLevels = initialData.levels.map((l, idx) =>
        typeof l === 'object' && 'level' in l && 'description' in l
          ? l
          : { level: idx, description: String(l) }
      );
      setLevels(parsedLevels);
    } else {
      setTitle('');
      setLevels([{ level: 0, description: '' }]);
    }
  }, [initialData]);

  const handleLevelChange = (
    index: number,
    field: 'level' | 'description',
    value: number | string
  ) => {
    const updated = [...levels];
    updated[index] = { ...updated[index], [field]: value };
    setLevels(updated);
  };

  const addLevel = () => {
    setLevels([...levels, { level: levels.length, description: '' }]);
  };

  const removeLevel = (index: number) => {
    setLevels(levels.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Build the GradingScale object
    const id = initialData?.id || uuidv4();
    const scale: GradingScale = {
      id,
      serviceLocationId,
      title,
      levels,
      createdAt: initialData?.createdAt,
      updatedAt: new Date(),
    };

    // Persist via abstraction layer
    await gradingScaleStore.save(scale);

    // Notify parent
    onSave(scale);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {isEdit ? 'Edit Grading Scale' : 'Add Grading Scale'}
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

          {levels.map((lvl, idx) => (
            <Grid container spacing={1} alignItems="center" key={idx}>
              <Grid item xs={2}>
                <TextField
                  label="Level"
                  type="number"
                  fullWidth
                  value={lvl.level}
                  onChange={(e) =>
                    handleLevelChange(idx, 'level', Number(e.target.value))
                  }
                />
              </Grid>
              <Grid item xs={8}>
                <TextField
                  label="Description"
                  fullWidth
                  value={lvl.description}
                  onChange={(e) =>
                    handleLevelChange(idx, 'description', e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={2}>
                <Button color="error" onClick={() => removeLevel(idx)}>
                  Remove
                </Button>
              </Grid>
            </Grid>
          ))}

          <Grid item xs={12}>
            <Button variant="outlined" onClick={addLevel}>
              Add Level
            </Button>
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
