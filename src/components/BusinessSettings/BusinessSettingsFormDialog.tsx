// src/components/BusinessSettings/BusinessSettingsFormDialog.tsx

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  Box,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { BusinessSettings } from '../../models/BusinessSettings';

interface Props {
  open: boolean;
  initialData: BusinessSettings;
  onClose: () => void;
  onSave: (settings: BusinessSettings) => void;
}

export default function BusinessSettingsFormDialog({
  open,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [data, setData] = useState<BusinessSettings>(initialData);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handleFieldChange = (
    field: keyof BusinessSettings,
    value: any
  ) => {
    setData((d) => ({ ...d, [field]: value }));
  };

  const handlePolicyChange = (
    key: keyof BusinessSettings['cancellationPolicy'],
    value: any
  ) => {
    setData((d) => ({
      ...d,
      cancellationPolicy: { ...d.cancellationPolicy, [key]: value },
    }));
  };

  const addAppointmentType = () => {
    const newType = {
      id: `temp-${Date.now()}`,
      title: '',
      durationMinutes: 60,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
      price: 0,
      order: data.appointmentTypes.length + 1,
      customFields: {},
    };
    setData((d) => ({
      ...d,
      appointmentTypes: [...d.appointmentTypes, newType],
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Edit Business Settings</DialogTitle>
      <DialogContent dividers>
        {/* Advance-booking window */}
        <Box mb={2}>
          <TextField
            type="number"
            label="Min Notice Hours"
            value={data.minNoticeHours}
            onChange={(e) =>
              handleFieldChange('minNoticeHours', Number(e.target.value))
            }
            fullWidth
            margin="dense"
          />
          <TextField
            type="number"
            label="Max Advance Days"
            value={data.maxAdvanceDays}
            onChange={(e) =>
              handleFieldChange('maxAdvanceDays', Number(e.target.value))
            }
            fullWidth
            margin="dense"
          />
        </Box>

        {/* Cancellation policy */}
        <Box mb={2}>
          <FormControlLabel
            control={
              <Checkbox
                checked={data.cancellationPolicy.allowClientCancel}
                onChange={(e) =>
                  handlePolicyChange('allowClientCancel', e.target.checked)
                }
              />
            }
            label="Allow Client Cancel"
          />
          <TextField
            type="number"
            label="Cancel Deadline Hours"
            value={data.cancellationPolicy.cancelDeadlineHours}
            onChange={(e) =>
              handlePolicyChange(
                'cancelDeadlineHours',
                Number(e.target.value)
              )
            }
            fullWidth
            margin="dense"
          />
          <TextField
            type="number"
            label="Fee on Late Cancel"
            value={data.cancellationPolicy.feeOnLateCancel}
            onChange={(e) =>
              handlePolicyChange(
                'feeOnLateCancel',
                Number(e.target.value)
              )
            }
            fullWidth
            margin="dense"
          />
        </Box>

        {/* Reschedule policy */}
        <Box mb={2}>
          <FormControlLabel
            control={
              <Checkbox
                checked={data.allowClientReschedule}
                onChange={(e) =>
                  handleFieldChange(
                    'allowClientReschedule',
                    e.target.checked
                  )
                }
              />
            }
            label="Allow Client Reschedule"
          />
          <TextField
            type="number"
            label="Reschedule Deadline Hours"
            value={data.rescheduleDeadlineHours}
            onChange={(e) =>
              handleFieldChange(
                'rescheduleDeadlineHours',
                Number(e.target.value)
              )
            }
            fullWidth
            margin="dense"
          />
        </Box>

        {/* Appointment types table */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle1">Appointment Types</Typography>
          <IconButton onClick={addAppointmentType}>
            <AddIcon />
          </IconButton>
        </Box>
        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Duration (mins)</TableCell>
                <TableCell>Buffer Before</TableCell>
                <TableCell>Buffer After</TableCell>
                <TableCell>Price</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.appointmentTypes.map((t, idx) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <TextField
                      value={t.title}
                      onChange={(e) => {
                        const updated = [...data.appointmentTypes];
                        updated[idx].title = e.target.value;
                        setData((d) => ({
                          ...d,
                          appointmentTypes: updated,
                        }));
                      }}
                      fullWidth
                      margin="dense"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={t.durationMinutes}
                      onChange={(e) => {
                        const updated = [...data.appointmentTypes];
                        updated[idx].durationMinutes = Number(e.target.value);
                        setData((d) => ({
                          ...d,
                          appointmentTypes: updated,
                        }));
                      }}
                      fullWidth
                      margin="dense"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={t.bufferBeforeMinutes}
                      onChange={(e) => {
                        const updated = [...data.appointmentTypes];
                        updated[idx].bufferBeforeMinutes = Number(e.target.value);
                        setData((d) => ({
                          ...d,
                          appointmentTypes: updated,
                        }));
                      }}
                      fullWidth
                      margin="dense"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={t.bufferAfterMinutes}
                      onChange={(e) => {
                        const updated = [...data.appointmentTypes];
                        updated[idx].bufferAfterMinutes = Number(e.target.value);
                        setData((d) => ({
                          ...d,
                          appointmentTypes: updated,
                        }));
                      }}
                      fullWidth
                      margin="dense"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={t.price}
                      onChange={(e) => {
                        const updated = [...data.appointmentTypes];
                        updated[idx].price = Number(e.target.value);
                        setData((d) => ({
                          ...d,
                          appointmentTypes: updated,
                        }));
                      }}
                      fullWidth
                      margin="dense"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave(data)}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
