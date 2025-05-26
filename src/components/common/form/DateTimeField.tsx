import React from 'react';
import { Controller, Control } from 'react-hook-form';
import { TextField } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

interface DateTimeFieldProps {
  name: string;
  control: Control<any>;
  label: string;
  disabled?: boolean;
  required?: boolean;
}

export default function DateTimeField({
  name,
  control,
  label,
  disabled = false,
  required = false,
}: DateTimeFieldProps) {
  return (
    <Controller
      name={name}
      control={control}
      rules={{ required }}
      render={({ field }) => (
        <DateTimePicker
          {...field}
          label={label}
          disabled={disabled}
          slotProps={{
            textField: {
              fullWidth: true,
              margin: 'normal',
              required,
            },
          }}
        />
      )}
    />
  );
}
