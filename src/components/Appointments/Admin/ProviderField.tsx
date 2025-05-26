import React from 'react';
import { TextField, MenuItem } from '@mui/material';

export interface ProviderFieldProps {
  value: string;
  onChange: (val: string) => void;
  options: { id: string; label: string }[];
  disabled?: boolean;
}

export default function ProviderField({
  value,
  onChange,
  options,
  disabled = false,
}: ProviderFieldProps) {
  return (
    <TextField
      select
      label="Service Provider"
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
