import React from 'react';
import { Controller, Control } from 'react-hook-form';
import { TextField, MenuItem } from '@mui/material';

export interface Option {
  id: string;
  label: string;
}

interface SelectFieldProps {
  name: string;
  control: Control<any>;
  label: string;
  options: Option[];
  disabled?: boolean;
  required?: boolean;
}

export default function SelectField({
  name,
  control,
  label,
  options,
  disabled = false,
  required = false,
}: SelectFieldProps) {
  return (
    <Controller
      name={name}
      control={control}
      rules={{ required }}
      render={({ field }) => (
        <TextField
          select
          {...field}
          label={label}
          margin="normal"
          fullWidth
          disabled={disabled}
          required={required}
        >
          {options.map((opt) => (
            <MenuItem key={opt.id} value={opt.id}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}
