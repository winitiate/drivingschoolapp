import React from 'react';
import { TextField, MenuItem } from '@mui/material';

export interface ClientFieldProps {
  value: string;
  onChange: (val: string) => void;
  options: { id: string; label: string }[];
  disabled?: boolean;
}

export default function ClientField({
  value,
  onChange,
  options,
  disabled = false,
}: ClientFieldProps) {
  return (
    <TextField
      select
      label="Client"
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
