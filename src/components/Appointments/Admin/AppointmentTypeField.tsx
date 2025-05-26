import React from 'react';
import { TextField, MenuItem } from '@mui/material';

export interface AppointmentTypeFieldProps {
  value: string;
  onChange: (val: string) => void;
  options: { id: string; label: string }[];
  disabled?: boolean;
}

export default function AppointmentTypeField({
  value,
  onChange,
  options,
  disabled = false,
}: AppointmentTypeFieldProps) {
  return (
    <TextField
      select
      label="Appointment Type"
      value={value}
      onChange={e => onChange(e.target.value)}
      fullWidth
      margin="normal"
      disabled={disabled}
    >
      {options.map(opt => (
        <MenuItem key={opt.id} value={opt.id}>
          {opt.label}
        </MenuItem>
      ))}
    </TextField>
  );
}
